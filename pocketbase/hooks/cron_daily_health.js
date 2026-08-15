// Cron diário (06:00 UTC): recalcula status de mensalidades atrasadas
// e o score de saúde dos clientes.
cronAdd('manutencao_diaria', '0 6 * * *', () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 1. Mensalidades: em_aberto com vencimento passado -> atrasada
  try {
    const abertas = $app.findRecordsByFilter(
      'mensalidades',
      'status = "em_aberto" && vencimento < {:today}',
      'vencimento',
      500,
      0,
      today.toISOString(),
    )
    for (const m of abertas) {
      m.set('status', 'atrasada')
      try {
        $app.save(m)
      } catch (err) {}
    }
  } catch (err) {
    $app.logger().warn('cron: atualiza mensalidades falhou', 'error', String(err))
  }

  // 2. Score de saúde dos clientes ativos
  let clientes = []
  try {
    clientes = $app.findRecordsByFilter('clientes', 'status_contrato = "ativo"', 'created', 500, 0)
  } catch (err) {
    return
  }

  for (const c of clientes) {
    let score = 0

    // Pagamento em dia (+40): nenhuma mensalidade atrasada
    try {
      const atrasadas = $app.findRecordsByFilter(
        'mensalidades',
        'cliente = {:id} && status = "atrasada"',
        'created',
        10,
        0,
        c.id,
      )
      if (atrasadas.length === 0) score += 40
    } catch (err) {}

    // Interação recente (+20): último contato há menos de 30 dias
    const ultimoContato = c.getString('ultimo_contato')
    if (ultimoContato) {
      const days = (new Date() - new Date(ultimoContato)) / 86400000
      if (days < 30) score += 20
    }

    // Uso ativo (+20): interações de operação nos últimos 30 dias
    try {
      const ref = new Date(Date.now() - 30 * 86400000).toISOString()
      const recentes = $app.findRecordsByFilter(
        'interacoes',
        'lead = {:id} && data_hora >= {:ref}',
        'created',
        5,
        0,
        c.getString('lead'),
        ref,
      )
      if (recentes.length > 0) score += 20
    } catch (err) {}

    // NPS/satisfação (+10) — placeholder: interação com resultado "satisfeito"
    try {
      const satisfeito = $app.findRecordsByFilter(
        'interacoes',
        'lead = {:id} && resultado ~ "satisfeito"',
        'created',
        1,
        0,
        c.getString('lead'),
      )
      if (satisfeito.length > 0) score += 10
    } catch (err) {}

    // Crescimento de volume (+10) — placeholder fixo
    score += 10

    const novoScore = Math.min(score, 100)
    if (novoScore !== c.getInt('score_saude')) {
      c.set('score_saude', novoScore)
      try {
        $app.save(c)
      } catch (err) {}
    }
  }
})

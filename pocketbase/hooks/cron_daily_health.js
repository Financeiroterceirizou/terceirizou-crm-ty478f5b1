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
})

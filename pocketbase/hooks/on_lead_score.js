// Calcula o lead score automaticamente e aplica a trava de regra de negócio no CREATE.
// Regras inegociáveis: só prestador de serviço; nunca cliente que vende/fabrica produto.
// Model hook: roda em qualquer $app.save() (API, agente, seed). Nunca chamar $app.save aqui.
onRecordCreate((e) => {
  const r = e.record

  // Trava de regra: não-prestador de serviço não avança — vai direto para Descartado.
  const tipo = r.getString('tipo_negocio')
  if (tipo && tipo !== 'prestador_servico') {
    r.set('etapa', 'descartado')
    if (!r.getString('motivo_descarte')) {
      r.set(
        'motivo_descarte',
        'Tipo de negócio incompatível: empresa vende ou fabrica produtos. Regra inegociável da Terceirizou.',
      )
    }
  }

  // Lead score automático (0-100)
  let score = 0
  if (tipo === 'prestador_servico') score += 40
  const nicho = r.getString('nicho')
  if (nicho && nicho !== 'outro') score += 15
  if (r.getBool('receita_recente')) score += 15
  const urg = r.getString('urgencia')
  const vol = r.getInt('volume_transacoes')
  if (urg === 'alta' || vol >= 300) score += 15
  const dec = (r.getString('decisor') || '').toLowerCase()
  if (dec.indexOf('don') === 0 || dec.indexOf('só') === 0 || dec.indexOf('soci') === 0) score += 10
  const canal = r.getString('canal_origem')
  if (canal === 'indicacao') score += 5
  if (tipo && tipo !== 'prestador_servico') score = -100

  r.set('score', score)
  if (score >= 60) r.set('prioridade', 'alta')
  else if (score >= 35) r.set('prioridade', 'media')
  else r.set('prioridade', 'baixa')

  // Padrão de etapa inicial
  if (!r.getString('etapa')) r.set('etapa', 'novo')

  e.next()
}, 'leads')

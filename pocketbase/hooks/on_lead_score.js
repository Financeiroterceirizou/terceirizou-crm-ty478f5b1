// Trava de regra de negócio no CREATE: só prestador de serviço; nunca cliente que vende/fabrica produto.
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

  // Padrão de etapa inicial
  if (!r.getString('etapa')) r.set('etapa', 'novo')

  e.next()
}, 'leads')

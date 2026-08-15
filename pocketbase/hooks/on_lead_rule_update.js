// Trava a regra também em UPDATE: se o tipo de negócio mudar para não-prestador,
// o lead é movido para Descartado com motivo.
// Model hook: roda em qualquer $app.save() de update. Nunca chamar $app.save aqui.
onRecordUpdate((e) => {
  const r = e.record
  const tipo = r.getString('tipo_negocio')

  if (tipo && tipo !== 'prestador_servico') {
    r.set('etapa', 'descartado')
    r.set(
      'motivo_descarte',
      'Tipo de negócio incompatível: empresa vende ou fabrica produtos. Regra inegociável da Terceirizou.',
    )
  }

  e.next()
}, 'leads')

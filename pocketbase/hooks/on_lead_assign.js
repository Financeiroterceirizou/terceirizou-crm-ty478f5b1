// Distribuição round-robin: quando um lead é criado sem responsável,
// atribui automaticamente ao vendedor com menos leads ativos.
// Model hook no CREATE. Nunca chamar $app.save aqui (o save em andamento persiste).
onRecordCreate((e) => {
  const r = e.record
  if (r.getString('responsavel')) return e.next()

  let vendedores = []
  try {
    vendedores = $app.findRecordsByFilter('users', "role = 'vendedor'", 'created', 100, 0)
  } catch (err) {
    return e.next()
  }
  if (vendedores.length === 0) return e.next()

  let best = vendedores[0]
  let bestCount = -1
  for (const v of vendedores) {
    let count = 0
    try {
      count = $app.findRecordsByFilter(
        'leads',
        'responsavel = {:id} && etapa != "cliente" && etapa != "perdido" && etapa != "descartado"',
        'created',
        500,
        0,
        v.id,
      ).length
    } catch (err) {
      count = 0
    }
    if (bestCount === -1 || count < bestCount) {
      bestCount = count
      best = v
    }
  }

  r.set('responsavel', best.id)
  e.next()
}, 'leads')

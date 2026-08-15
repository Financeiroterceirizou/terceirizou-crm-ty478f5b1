// Reunião realizada -> avança o lead conforme o resultado.
onRecordAfterUpdateSuccess((e) => {
  const reuniao = e.record
  if (reuniao.getString('status') !== 'realizada') return e.next()

  const leadId = reuniao.getString('lead')
  if (!leadId) return e.next()

  let lead = null
  try {
    lead = $app.findRecordById('leads', leadId)
  } catch (err) {
    return e.next()
  }

  const resultado = reuniao.getString('resultado')
  if (resultado === 'avancou' || resultado === 'pediu_proposta') {
    lead.set('etapa', 'proposta_enviada')
  } else if (resultado === 'sem_interesse') {
    lead.set('etapa', 'perdido')
    lead.set('motivo_perda', 'Sem interesse após reunião de fechamento.')
  }

  try {
    $app.save(lead)
  } catch (err) {
    $app.logger().warn('reuniao realizada: falha ao atualizar lead', 'error', String(err))
  }

  e.next()
}, 'reunioes')

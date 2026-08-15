// Reunião criada -> marca o lead como reuniao_agendada.
onRecordAfterCreateSuccess((e) => {
  const reuniao = e.record
  const leadId = reuniao.getString('lead')
  if (!leadId) return e.next()

  let lead = null
  try {
    lead = $app.findRecordById('leads', leadId)
  } catch (err) {
    return e.next()
  }

  lead.set('etapa', 'reuniao_agendada')
  try {
    $app.save(lead)
  } catch (err) {
    $app.logger().warn('reuniao: falha ao atualizar lead', 'error', String(err))
  }

  e.next()
}, 'reunioes')

// Interação criada -> atualiza o lead com último contato e próximo passo,
// e avança a etapa de novo para primeiro_contato na primeira interação de saída.
onRecordAfterCreateSuccess((e) => {
  const inter = e.record
  const leadId = inter.getString('lead')
  if (!leadId) return e.next()

  let lead = null
  try {
    lead = $app.findRecordById('leads', leadId)
  } catch (err) {
    return e.next()
  }

  let changed = false
  if (inter.getString('data_hora')) {
    lead.set('ultimo_contato', inter.getString('data_hora'))
    changed = true
  }
  if (inter.getString('proximo_passo')) {
    lead.set('proximo_passo', inter.getString('proximo_passo'))
    if (inter.getString('data_proximo_passo')) {
      lead.set('data_proximo_passo', inter.getString('data_proximo_passo'))
    }
    changed = true
  }
  if (lead.getString('etapa') === 'novo' && inter.getString('tipo') === 'saida') {
    lead.set('etapa', 'primeiro_contato')
    changed = true
  }

  if (changed) {
    try {
      $app.save(lead)
    } catch (err) {
      $app.logger().warn('interacao: falha ao atualizar lead', 'error', String(err))
    }
  }

  e.next()
}, 'interacoes')

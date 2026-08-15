// Formulário público de indicação: recebe a indicação, cria o lead com canal "indicacao"
// e bônus de score, e registra o indicador.
routerAdd('POST', '/backend/v1/webhook/indicacao', (e) => {
  const body = e.requestInfo().body || {}

  const nome = String(body.nome || '').trim()
  const empresa = String(body.empresa || '').trim()
  const telefone = String(body.telefone || body.whatsapp || '').trim()
  const indicadoPor = String(body.indicado_por || body.indicador || '').trim()

  if (!nome || !telefone) {
    return e.badRequestError('nome e telefone são obrigatórios')
  }

  // Cria o lead (canal = indicacao)
  let lead = null
  try {
    const col = $app.findCollectionByNameOrId('leads')
    lead = new Record(col)
    lead.set('nome', nome)
    lead.set('empresa', empresa || nome)
    lead.set('telefone', telefone)
    lead.set('canal_origem', 'indicacao')
    lead.set('indicado_por', indicadoPor)
    lead.set('tipo_negocio', 'prestador_servico')
    lead.set('etapa', 'novo')
    $app.save(lead)
  } catch (err) {
    $app.logger().error('indicacao: falha ao criar lead', 'error', String(err))
    return e.internalServerError('Falha ao registrar indicação')
  }

  // Registra interação
  try {
    const colInter = $app.findCollectionByNameOrId('interacoes')
    const inter = new Record(colInter)
    inter.set('lead', lead.id)
    inter.set('canal', 'indicacao')
    inter.set('tipo', 'entrada')
    inter.set('data_hora', new Date().toISOString())
    inter.set('resumo', 'Indicação recebida de ' + (indicadoPor || 'desconhecido'))
    $app.save(inter)
  } catch (err) {}

  return e.json(201, { ok: true, lead_id: lead.id })
})

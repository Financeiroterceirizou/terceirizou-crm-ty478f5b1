// Webhook unificado de canais: recebe mensagens de WhatsApp/Instagram/Facebook/LinkedIn/Telegram.
// Cria ou localiza o lead pela origem + telefone/remetente e delega a conversa ao agente de qualificação.
routerAdd('POST', '/backend/v1/webhook/canal', (e) => {
  const body = e.requestInfo().body || {}

  const canal = String(body.canal || '').toLowerCase()
  const canaisValidos = ['whatsapp', 'instagram', 'facebook', 'linkedin', 'telegram']
  if (canaisValidos.indexOf(canal) === -1) {
    return e.badRequestError('Canal inválido. Use: ' + canaisValidos.join(', '))
  }

  const telefone = String(body.telefone || body.from || body.sender || '').trim()
  const nome = String(body.nome || body.name || '').trim()
  const mensagem = String(body.mensagem || body.message || body.text || '').trim()
  if (!telefone) return e.badRequestError('telefone/remetente é obrigatório')

  // Localiza lead existente por telefone (dedup por canal)
  let lead = null
  try {
    const found = $app.findRecordsByFilter('leads', 'telefone = {:t}', '-created', 1, 0, telefone)
    if (found.length > 0) lead = found[0]
  } catch (err) {}

  // Cria se não existir
  if (!lead) {
    try {
      const col = $app.findCollectionByNameOrId('leads')
      lead = new Record(col)
      lead.set('nome', nome || 'Lead ' + canal)
      lead.set('empresa', nome || 'Lead ' + canal)
      lead.set('telefone', telefone)
      lead.set('canal_origem', canal)
      lead.set('tipo_negocio', 'prestador_servico')
      lead.set('etapa', 'novo')
      $app.save(lead)
    } catch (err) {
      $app.logger().error('webhook canal: falha ao criar lead', 'error', String(err))
      return e.internalServerError('Falha ao criar lead')
    }
  }

  // Registra interação de entrada
  try {
    const colInter = $app.findCollectionByNameOrId('interacoes')
    const inter = new Record(colInter)
    inter.set('lead', lead.id)
    inter.set('canal', canal)
    inter.set('tipo', 'entrada')
    inter.set('data_hora', new Date().toISOString())
    inter.set('resumo', mensagem || 'Contato via ' + canal)
    $app.save(inter)
  } catch (err) {
    $app.logger().warn('webhook canal: falha ao registrar interacao', 'error', String(err))
  }

  // Delega a conversa ao agente de qualificação (se houver mensagem)
  let resposta = 'Recebemos seu contato! Em instantes nosso time retorna. Obrigado!'
  if (mensagem) {
    try {
      const result = $ai.agent('qualificador-leads').chat({
        user_id: lead.id,
        conversation_id: null,
        message: mensagem,
      })
      if (result && result.content) resposta = result.content
    } catch (err) {
      $app.logger().warn('webhook canal: agente falhou', 'error', String(err))
    }
  }

  return e.json(200, { ok: true, lead_id: lead.id, resposta: resposta })
})

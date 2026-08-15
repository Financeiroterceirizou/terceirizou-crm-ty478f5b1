// Endpoint de conversa com o agente de qualificação (usado pela caixa de entrada do CRM).
// O user_id é sempre o id do lead — o runtime valida a propriedade da conversa.
routerAdd(
  'POST',
  '/backend/v1/conversa',
  (e) => {
    const body = e.requestInfo().body || {}
    const leadId = String(body.lead_id || '').trim()
    const mensagem = String(body.message || body.mensagem || '').trim()

    if (!leadId) return e.badRequestError('lead_id é obrigatório')
    if (!mensagem) return e.badRequestError('mensagem é obrigatória')

    const result = $ai.agent('qualificador-leads').chat({
      user_id: leadId,
      conversation_id: body.conversation_id || null,
      message: mensagem,
    })

    return e.json(200, {
      content: result && result.content ? result.content : '',
      conversation_id: result && result.conversation_id ? result.conversation_id : null,
    })
  },
  $apis.requireAuth(),
)

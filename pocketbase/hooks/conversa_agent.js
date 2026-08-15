// Endpoint de conversa com o agente de qualificação (usado pela caixa de entrada do CRM).
// user_id = e.auth.id (vendedor/operadora logado). O runtime valida a propriedade da conversa.
routerAdd(
  'POST',
  '/backend/v1/conversa',
  (e) => {
    const body = e.requestInfo().body || {}
    const userId = e.auth && e.auth.id ? e.auth.id : ''
    if (!userId) return e.unauthorizedError('auth required')

    const leadId = String(body.lead_id || '').trim()
    const mensagem = String(body.message || body.mensagem || '').trim()
    if (!leadId) return e.badRequestError('lead_id é obrigatório')
    if (!mensagem) return e.badRequestError('mensagem é obrigatória')

    try {
      const result = $ai.agent('qualificador-leads').chat({
        user_id: userId,
        conversation_id: body.conversation_id || null,
        message: mensagem,
      })
      return e.json(200, {
        content: result && result.content ? result.content : '',
        conversation_id: result && result.conversation_id ? result.conversation_id : null,
      })
    } catch (err) {
      $app
        .logger()
        .error('conversa: agente falhou', 'error', String(err && err.message ? err.message : err))
      return e.json(502, { error: 'agent request failed' })
    }
  },
  $apis.requireAuth(),
)

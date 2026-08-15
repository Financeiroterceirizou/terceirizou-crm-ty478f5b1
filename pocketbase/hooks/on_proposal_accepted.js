// Proposta aceita -> cria o cliente, o checklist de implantação e a primeira mensalidade.
// Também atualiza o lead para a etapa "cliente".
onRecordAfterUpdateSuccess((e) => {
  const proposta = e.record
  if (proposta.getString('status') !== 'aceita') return e.next()

  const leadId = proposta.getString('lead')
  const planoId = proposta.getString('plano')
  if (!leadId) return e.next()

  let lead = null
  try {
    lead = $app.findRecordById('leads', leadId)
  } catch (err) {
    return e.next()
  }

  // Cliente já criado para este lead? Não duplica.
  try {
    $app.findFirstRecordByFilter('clientes', 'lead = {:id}', leadId)
    return e.next()
  } catch (_) {}

  const usersId = '_pb_users_auth_'
  const planosId = planoId ? planoId : ''

  const valor = proposta.getFloat('valor_mensal') || 0
  const nowIso = new Date().toISOString()

  // 1. Cliente
  let cliente = null
  try {
    const colClientes = $app.findCollectionByNameOrId('clientes')
    cliente = new Record(colClientes)
    cliente.set('lead', leadId)
    if (planoId) cliente.set('plano', planoId)
    cliente.set('valor_mensal', valor)
    cliente.set('data_inicio', nowIso)
    cliente.set('status_contrato', 'ativo')
    cliente.set('score_saude', 60)
    $app.save(cliente)
  } catch (err) {
    $app.logger().error('proposta aceita: falha ao criar cliente', 'error', String(err))
    return e.next()
  }

  // 2. Checklist de implantação
  const etapasImplantacao = [
    'coleta_dados',
    'definicao_plano',
    'integracao_sistema',
    'cadastro_contas',
    'treinamento_cliente',
  ]
  for (const etapa of etapasImplantacao) {
    try {
      const colImp = $app.findCollectionByNameOrId('implantacao')
      const imp = new Record(colImp)
      imp.set('cliente', cliente.id)
      imp.set('etapa', etapa)
      imp.set('status', 'pendente')
      $app.save(imp)
    } catch (err) {
      $app.logger().error('implantacao etapa falhou', 'etapa', etapa, 'error', String(err))
    }
  }

  // 3. Primeira mensalidade (competência do mês corrente)
  try {
    const colMens = $app.findCollectionByNameOrId('mensalidades')
    const mens = new Record(colMens)
    const d = new Date()
    const competencia = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    mens.set('cliente', cliente.id)
    mens.set('competencia', competencia)
    mens.set('valor', valor)
    const venc = new Date(d.getFullYear(), d.getMonth() + 1, 10)
    mens.set('vencimento', venc.toISOString())
    mens.set('status', 'em_aberto')
    $app.save(mens)
  } catch (err) {
    $app.logger().error('proposta aceita: falha ao criar mensalidade', 'error', String(err))
  }

  // 4. Lead vira cliente
  lead.set('etapa', 'cliente')
  try {
    $app.save(lead)
  } catch (err) {
    $app.logger().warn('proposta aceita: falha ao atualizar lead', 'error', String(err))
  }

  e.next()
}, 'propostas')

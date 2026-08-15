// Deduplicação: após criar um lead, procura por telefone, CNPJ ou e-mail iguais.
// Se encontrar, marca o novo como duplicado e registra interação no registro existente.
onRecordAfterCreateSuccess((e) => {
  const record = e.record
  const telefone = record.getString('telefone') || ''
  const cnpj = record.getString('cnpj') || ''
  const email = record.getString('email') || ''

  const conditions = []
  if (telefone) conditions.push('telefone = {:t}')
  if (cnpj) conditions.push('cnpj = {:c}')
  if (email) conditions.push('email = {:e}')
  if (conditions.length === 0) return e.next()

  const filter = conditions.join(' || ')
  let dupes = []
  try {
    dupes = $app.findRecordsByFilter('leads', filter, '-created', 10, 0, telefone, cnpj, email)
  } catch (err) {
    $app.logger().warn('dedup query failed', 'error', String(err))
    return e.next()
  }

  const existing = dupes.find((d) => d.id !== record.id)
  if (!existing) return e.next()

  // Marca o novo como duplicado (update — dispara onRecordUpdate, sem loop)
  record.set('etapa', 'descartado')
  record.set('motivo_descarte', 'Lead duplicado do registro existente: ' + existing.id)
  try {
    $app.save(record)
  } catch (err) {
    $app.logger().warn('dedup: falha ao descartar duplicado', 'error', String(err))
    return e.next()
  }

  // Registra interação no existente para manter o histórico
  try {
    const col = $app.findCollectionByNameOrId('interacoes')
    const inter = new Record(col)
    inter.set('lead', existing.id)
    inter.set('canal', record.getString('canal_origem') || 'whatsapp')
    inter.set('tipo', 'entrada')
    inter.set('data_hora', new Date().toISOString())
    inter.set(
      'resumo',
      'Lead duplicado recebido pelo canal ' +
        (record.getString('canal_origem') || '?') +
        ' — mesclado neste registro.',
    )
    $app.save(inter)
  } catch (err) {
    $app.logger().warn('dedup: falha ao registrar interacao', 'error', String(err))
  }

  e.next()
}, 'leads')

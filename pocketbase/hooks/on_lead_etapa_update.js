// Atribui a prioridade do lead com base no score quando ele entra no funil ativo.
// Funil ativo: qualificado, primeiro_contato, reuniao_agendada, reuniao_realizada,
// proposta_enviada, negociacao. Fora do funil (novo, cliente, perdido, descartado) => sem_prioridade.
// Model hook: roda em qualquer $app.save() de update. Nunca chamar $app.save aqui.
onRecordUpdate((e) => {
  const r = e.record
  const etapa = r.getString('etapa')

  const FUNIL = [
    'qualificado',
    'primeiro_contato',
    'reuniao_agendada',
    'reuniao_realizada',
    'proposta_enviada',
    'negociacao',
  ]

  if (FUNIL.indexOf(etapa) !== -1) {
    const score = r.getInt('score')
    if (score >= 60) r.set('prioridade', 'alta')
    else if (score >= 35) r.set('prioridade', 'media')
    else r.set('prioridade', 'baixa')
  } else {
    r.set('prioridade', 'sem_prioridade')
  }

  e.next()
}, 'leads')

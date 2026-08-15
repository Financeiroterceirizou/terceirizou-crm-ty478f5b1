// CRM Terceirizou — Etapa 1: Interações, Reuniões e Propostas (histórico comercial). Re-upload pós-correção.
migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const leadsId = app.findCollectionByNameOrId('leads').id
    const planosId = app.findCollectionByNameOrId('planos').id

    const interacoes = new Collection({
      name: 'interacoes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'lead',
          type: 'relation',
          collectionId: leadsId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'canal',
          type: 'select',
          values: [
            'instagram',
            'facebook',
            'linkedin',
            'email',
            'whatsapp',
            'telegram',
            'indicacao',
            'reuniao',
            'ligacao',
          ],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'tipo',
          type: 'select',
          values: ['entrada', 'saida'],
          maxSelect: 1,
          required: true,
        },
        { name: 'data_hora', type: 'date', required: true },
        { name: 'responsavel', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'resumo', type: 'text' },
        { name: 'proximo_passo', type: 'text' },
        { name: 'data_proximo_passo', type: 'date' },
        { name: 'resultado', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_interacoes_lead_data ON interacoes (lead, data_hora)'],
    })
    app.save(interacoes)

    const reunioes = new Collection({
      name: 'reunioes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'lead',
          type: 'relation',
          collectionId: leadsId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'responsavel', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'data_hora', type: 'date', required: true },
        {
          name: 'formato',
          type: 'select',
          values: ['presencial', 'video', 'telefone'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['agendada', 'realizada', 'cancelada', 'nao_compareceu'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'resultado',
          type: 'select',
          values: ['avancou', 'pediu_proposta', 'sem_interesse', 'recompra'],
          maxSelect: 1,
        },
        { name: 'proximo_passo', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_reunioes_data ON reunioes (data_hora)',
        'CREATE INDEX idx_reunioes_status ON reunioes (status)',
      ],
    })
    app.save(reunioes)

    const propostas = new Collection({
      name: 'propostas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'lead',
          type: 'relation',
          collectionId: leadsId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'plano', type: 'relation', collectionId: planosId, maxSelect: 1, required: true },
        { name: 'valor_mensal', type: 'number', required: true },
        { name: 'condicoes_pagamento', type: 'text' },
        { name: 'data_envio', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['enviada', 'vista', 'aceita', 'recusada', 'vencida'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_propostas_lead ON propostas (lead)'],
    })
    app.save(propostas)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('propostas'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('reunioes'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('interacoes'))
    } catch (_) {}
  },
)

migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const leadsId = app.findCollectionByNameOrId('leads').id
    const clientesId = app.findCollectionByNameOrId('clientes').id

    const mensalidades = new Collection({
      name: 'mensalidades',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          collectionId: clientesId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        { name: 'competencia', type: 'text', required: true },
        { name: 'valor', type: 'number', required: true },
        { name: 'vencimento', type: 'date', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['paga', 'em_aberto', 'atrasada'],
          maxSelect: 1,
          required: true,
        },
        { name: 'data_pagamento', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_mensalidades_cliente_comp ON mensalidades (cliente, competencia)',
        'CREATE INDEX idx_mensalidades_status_venc ON mensalidades (status, vencimento)',
      ],
    })
    app.save(mensalidades)

    const implantacao = new Collection({
      name: 'implantacao',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'cliente',
          type: 'relation',
          collectionId: clientesId,
          cascadeDelete: true,
          maxSelect: 1,
          required: true,
        },
        {
          name: 'etapa',
          type: 'select',
          values: [
            'coleta_dados',
            'definicao_plano',
            'integracao_sistema',
            'cadastro_contas',
            'treinamento_cliente',
          ],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'em_andamento', 'concluida'],
          maxSelect: 1,
          required: true,
        },
        { name: 'responsavel', type: 'relation', collectionId: usersId, maxSelect: 1 },
        { name: 'prazo', type: 'date' },
        { name: 'data_conclusao', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_implantacao_cliente ON implantacao (cliente)'],
    })
    app.save(implantacao)

    const tarefas = new Collection({
      name: 'tarefas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'tipo',
          type: 'select',
          values: [
            'follow_up',
            'envio_proposta',
            'ligacao',
            'implantacao',
            'cobranca',
            'renovacao',
          ],
          maxSelect: 1,
          required: true,
        },
        { name: 'lead', type: 'relation', collectionId: leadsId, maxSelect: 1 },
        { name: 'cliente', type: 'relation', collectionId: clientesId, maxSelect: 1 },
        {
          name: 'responsavel',
          type: 'relation',
          collectionId: usersId,
          maxSelect: 1,
          required: true,
        },
        { name: 'prazo', type: 'date' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'concluida', 'cancelada'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tarefas_prazo ON tarefas (prazo)',
        'CREATE INDEX idx_tarefas_status ON tarefas (status)',
      ],
    })
    app.save(tarefas)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('tarefas'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('implantacao'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('mensalidades'))
    } catch (_) {}
  },
)

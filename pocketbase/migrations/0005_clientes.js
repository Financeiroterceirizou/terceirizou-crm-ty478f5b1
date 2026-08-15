migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const leadsId = app.findCollectionByNameOrId('leads').id
    const planosId = app.findCollectionByNameOrId('planos').id

    const clientes = new Collection({
      name: 'clientes',
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
        { name: 'plano', type: 'relation', collectionId: planosId, maxSelect: 1 },
        { name: 'valor_mensal', type: 'number', required: true },
        { name: 'data_inicio', type: 'date', required: true },
        {
          name: 'status_contrato',
          type: 'select',
          values: ['ativo', 'inadimplente', 'cancelado'],
          maxSelect: 1,
          required: true,
        },
        { name: 'operadora', type: 'relation', collectionId: usersId, maxSelect: 1 },
        {
          name: 'formato_envio',
          type: 'select',
          values: ['whatsapp', 'email', 'integracao_automatica'],
          maxSelect: 1,
        },
        {
          name: 'unidade',
          type: 'select',
          values: ['floripa', 'tubarao'],
          maxSelect: 1,
        },
        { name: 'ultimo_contato', type: 'date' },
        { name: 'score_saude', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_clientes_status ON clientes (status_contrato)',
        'CREATE INDEX idx_clientes_operadora ON clientes (operadora)',
      ],
    })
    app.save(clientes)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('clientes'))
    } catch (_) {}
  },
)

migrate(
  (app) => {
    const planos = new Collection({
      name: 'planos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'tipo',
          type: 'select',
          values: ['recorrente', 'consultoria_pontual', 'implantacao'],
          maxSelect: 1,
          required: true,
        },
        { name: 'faixa_volume', type: 'text' },
        { name: 'min_transacoes', type: 'number' },
        { name: 'max_transacoes', type: 'number' },
        { name: 'valor_mensal', type: 'number' },
        { name: 'servicos_inclusos', type: 'text' },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_planos_ativo ON planos (ativo)'],
    })
    app.save(planos)

    const campanhas = new Collection({
      name: 'campanhas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'data_inicio', type: 'date', required: true },
        { name: 'data_fim', type: 'date', required: true },
        { name: 'meta_reunioes', type: 'number' },
        { name: 'meta_faturamento', type: 'number' },
        {
          name: 'status',
          type: 'select',
          values: ['ativa', 'encerrada', 'rascunho'],
          maxSelect: 1,
          required: true,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(campanhas)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('campanhas'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('planos'))
    } catch (_) {}
  },
)

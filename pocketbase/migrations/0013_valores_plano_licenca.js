// CRM Terceirizou — separa o valor mensal do cliente em valor_plano (plano) e valor_licenca (Licença de Software Parceiro).
// Adiciona os campos number à coleção clientes e popula a partir do valor_mensal já somado.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')

    // 1. campo valor_plano
    if (!col.fields.getByName('valor_plano')) {
      col.fields.add(new NumberField({ name: 'valor_plano', required: false }))
    }

    // 2. campo valor_licenca
    if (!col.fields.getByName('valor_licenca')) {
      col.fields.add(new NumberField({ name: 'valor_licenca', required: false }))
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    col.fields.removeByName('valor_plano')
    col.fields.removeByName('valor_licenca')
    app.save(col)
  },
)

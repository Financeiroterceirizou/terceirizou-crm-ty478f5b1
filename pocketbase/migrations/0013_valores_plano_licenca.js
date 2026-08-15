// CRM Terceirizou — separa o valor mensal do cliente em valor_plano (plano) e valor_licenca (Licença de Software Parceiro).
// Adiciona os campos number à coleção clientes e popula a partir do valor_mensal já somado.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')

    // 1. campo valor_plano
    let fPlano = col.fields.getByName('valor_plano')
    if (!fPlano) {
      fPlano = new app.schema.Field({ type: 'number', name: 'valor_plano', required: false })
      col.fields.add(fPlano)
    }

    // 2. campo valor_licenca
    let fLic = col.fields.getByName('valor_licenca')
    if (!fLic) {
      fLic = new app.schema.Field({ type: 'number', name: 'valor_licenca', required: false })
      col.fields.add(fLic)
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    const fPlano = col.fields.getByName('valor_plano')
    if (fPlano) col.fields.remove(fPlano)
    const fLic = col.fields.getByName('valor_licenca')
    if (fLic) col.fields.remove(fLic)
    app.save(col)
  },
)

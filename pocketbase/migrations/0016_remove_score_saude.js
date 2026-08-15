// CRM Terceirizou — remove o campo score_saude da coleção clientes (score de saúde descontinuado).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    if (col.fields.getByName('score_saude')) {
      col.fields.removeByName('score_saude')
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clientes')
    if (!col.fields.getByName('score_saude')) {
      col.fields.add(new NumberField({ name: 'score_saude', required: false }))
    }
    app.save(col)
  },
)

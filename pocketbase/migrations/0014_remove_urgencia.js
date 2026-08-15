// CRM Terceirizou — remove o campo "urgencia" da coleção leads.
// O campo era subjetivo e duplicava o papel da prioridade; decidido remover.
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    if (col.fields.getByName('urgencia')) {
      col.fields.removeByName('urgencia')
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    if (!col.fields.getByName('urgencia')) {
      col.fields.add(
        new SelectField({ name: 'urgencia', values: ['baixa', 'media', 'alta'], maxSelect: 1 }),
      )
    }
    app.save(col)
  },
)

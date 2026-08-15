// CRM Terceirizou — remove os campos score e prioridade da coleção leads (score e prioridade descontinuados).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    if (col.fields.getByName('score')) {
      col.fields.removeByName('score')
    }
    if (col.fields.getByName('prioridade')) {
      col.fields.removeByName('prioridade')
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    if (!col.fields.getByName('score')) {
      col.fields.add(new NumberField({ name: 'score', required: false }))
    }
    if (!col.fields.getByName('prioridade')) {
      col.fields.add(
        new SelectField({
          name: 'prioridade',
          values: ['sem_prioridade', 'baixa', 'media', 'alta'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
)

// CRM Terceirizou — adiciona a opção "sem_prioridade" ao campo prioridade (leads).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    const f = col.fields.getByName('prioridade')
    if (f && (f.values || []).indexOf('sem_prioridade') === -1) {
      f.values = ['sem_prioridade'].concat(f.values || [])
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    const f = col.fields.getByName('prioridade')
    if (f) {
      f.values = (f.values || []).filter((v) => v !== 'sem_prioridade')
    }
    app.save(col)
  },
)

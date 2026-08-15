// CRM Terceirizou — Etapa 2: campos de acompanhamento no lead
// (último contato e próximo passo, espelhados das interações).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    if (!col.fields.getByName('ultimo_contato')) {
      col.fields.add(new DateField({ name: 'ultimo_contato' }))
    }
    if (!col.fields.getByName('proximo_passo')) {
      col.fields.add(new TextField({ name: 'proximo_passo' }))
    }
    if (!col.fields.getByName('data_proximo_passo')) {
      col.fields.add(new DateField({ name: 'data_proximo_passo' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    if (col.fields.getByName('data_proximo_passo')) col.fields.removeByName('data_proximo_passo')
    if (col.fields.getByName('proximo_passo')) col.fields.removeByName('proximo_passo')
    if (col.fields.getByName('ultimo_contato')) col.fields.removeByName('ultimo_contato')
    app.save(col)
  },
)

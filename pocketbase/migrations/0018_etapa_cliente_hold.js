// CRM Terceirizou — adiciona a etapa "cliente_hold" ao funil de leads.
// Lead que já é cliente da HOLD Contabilidade (indicação quente do ecossistema).
migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    const f = col.fields.getByName('etapa')
    if (f && (f.values || []).indexOf('cliente_hold') === -1) {
      f.values = (f.values || []).concat(['cliente_hold'])
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('leads')
    const f = col.fields.getByName('etapa')
    if (f) {
      f.values = (f.values || []).filter((v) => v !== 'cliente_hold')
    }
    app.save(col)
  },
)

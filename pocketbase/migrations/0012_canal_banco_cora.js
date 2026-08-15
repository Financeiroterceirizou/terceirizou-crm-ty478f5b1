// CRM Terceirizou — adiciona o canal "Banco Cora" (parceria).
// Novo valor no select canal_origem (leads) e canal (interacoes),
// e migra os leads/interações da parceria para o novo canal.
migrate(
  (app) => {
    // 1. leads.canal_origem
    const leadsCol = app.findCollectionByNameOrId('leads')
    const fCanal = leadsCol.fields.getByName('canal_origem')
    if (fCanal && (fCanal.values || []).indexOf('banco_cora') === -1) {
      fCanal.values = (fCanal.values || []).concat(['banco_cora'])
    }
    app.save(leadsCol)

    // 2. interacoes.canal
    const interCol = app.findCollectionByNameOrId('interacoes')
    const fInter = interCol.fields.getByName('canal')
    if (fInter && (fInter.values || []).indexOf('banco_cora') === -1) {
      fInter.values = (fInter.values || []).concat(['banco_cora'])
    }
    app.save(interCol)

    // 3. Migra leads da parceria: canal_origem = banco_cora
    let coraLeads = []
    try {
      coraLeads = app.findRecordsByFilter('leads', 'indicado_por ~ "Banco Cora"', 'created', 500, 0)
    } catch (_) {}
    for (const l of coraLeads) {
      l.set('canal_origem', 'banco_cora')
      try {
        app.save(l)
      } catch (_) {}
    }

    // 4. Migra interações da parceria
    let cors = []
    try {
      cors = app.findRecordsByFilter('interacoes', 'resumo ~ "Banco Cora"', 'created', 500, 0)
    } catch (_) {}
    for (const i of cors) {
      i.set('canal', 'banco_cora')
      try {
        app.save(i)
      } catch (_) {}
    }
  },
  (app) => {
    // Down: volta os leads/interações para "indicacao" e remove o valor do select
    let coraLeads = []
    try {
      coraLeads = app.findRecordsByFilter('leads', 'canal_origem = "banco_cora"', 'created', 500, 0)
    } catch (_) {}
    for (const l of coraLeads) {
      l.set('canal_origem', 'indicacao')
      try {
        app.save(l)
      } catch (_) {}
    }
    let cors = []
    try {
      cors = app.findRecordsByFilter('interacoes', 'canal = "banco_cora"', 'created', 500, 0)
    } catch (_) {}
    for (const i of cors) {
      i.set('canal', 'indicacao')
      try {
        app.save(i)
      } catch (_) {}
    }
    try {
      const leadsCol = app.findCollectionByNameOrId('leads')
      const fCanal = leadsCol.fields.getByName('canal_origem')
      if (fCanal) fCanal.values = (fCanal.values || []).filter((v) => v !== 'banco_cora')
      app.save(leadsCol)
    } catch (_) {}
    try {
      const interCol = app.findCollectionByNameOrId('interacoes')
      const fInter = interCol.fields.getByName('canal')
      if (fInter) fInter.values = (fInter.values || []).filter((v) => v !== 'banco_cora')
      app.save(interCol)
    } catch (_) {}
  },
)

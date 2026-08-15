// CRM Terceirizou — unifica os canais Facebook e Instagram em "Meta".
// 1. Migra leads.canal_origem facebook/instagram -> meta
// 2. Migra interacoes.canal facebook/instagram -> meta
// 3. Atualiza os selects: adiciona "meta", remove "instagram" e "facebook"
migrate(
  (app) => {
    // 1. Leads
    let leadsMeta = []
    try {
      leadsMeta = app.findRecordsByFilter(
        'leads',
        'canal_origem = "facebook" || canal_origem = "instagram"',
        'created',
        1000,
        0,
      )
    } catch (_) {}
    for (const l of leadsMeta) {
      l.set('canal_origem', 'meta')
      try {
        app.save(l)
      } catch (_) {}
    }

    // 2. Interações
    let intersMeta = []
    try {
      intersMeta = app.findRecordsByFilter(
        'interacoes',
        'canal = "facebook" || canal = "instagram"',
        'created',
        1000,
        0,
      )
    } catch (_) {}
    for (const i of intersMeta) {
      i.set('canal', 'meta')
      try {
        app.save(i)
      } catch (_) {}
    }

    // 3. Selects
    const leadsCol = app.findCollectionByNameOrId('leads')
    const fCanal = leadsCol.fields.getByName('canal_origem')
    if (fCanal) {
      let vals = fCanal.values || []
      if (vals.indexOf('meta') === -1) vals = vals.concat(['meta'])
      vals = vals.filter((v) => v !== 'facebook' && v !== 'instagram')
      fCanal.values = vals
    }
    app.save(leadsCol)

    const interCol = app.findCollectionByNameOrId('interacoes')
    const fInter = interCol.fields.getByName('canal')
    if (fInter) {
      let vals = fInter.values || []
      if (vals.indexOf('meta') === -1) vals = vals.concat(['meta'])
      vals = vals.filter((v) => v !== 'facebook' && v !== 'instagram')
      fInter.values = vals
    }
    app.save(interCol)
  },
  (app) => {
    // Down: volta os leads/interações para facebook (origem original)
    let leadsMeta = []
    try {
      leadsMeta = app.findRecordsByFilter('leads', 'canal_origem = "meta"', 'created', 1000, 0)
    } catch (_) {}
    for (const l of leadsMeta) {
      l.set('canal_origem', 'facebook')
      try {
        app.save(l)
      } catch (_) {}
    }
    let intersMeta = []
    try {
      intersMeta = app.findRecordsByFilter('interacoes', 'canal = "meta"', 'created', 1000, 0)
    } catch (_) {}
    for (const i of intersMeta) {
      i.set('canal', 'facebook')
      try {
        app.save(i)
      } catch (_) {}
    }
    try {
      const leadsCol = app.findCollectionByNameOrId('leads')
      const fCanal = leadsCol.fields.getByName('canal_origem')
      if (fCanal) {
        let vals = (fCanal.values || []).filter((v) => v !== 'meta')
        if (vals.indexOf('facebook') === -1) vals = vals.concat(['facebook'])
        if (vals.indexOf('instagram') === -1) vals = vals.concat(['instagram'])
        fCanal.values = vals
      }
      app.save(leadsCol)
    } catch (_) {}
    try {
      const interCol = app.findCollectionByNameOrId('interacoes')
      const fInter = interCol.fields.getByName('canal')
      if (fInter) {
        let vals = (fInter.values || []).filter((v) => v !== 'meta')
        if (vals.indexOf('facebook') === -1) vals = vals.concat(['facebook'])
        if (vals.indexOf('instagram') === -1) vals = vals.concat(['instagram'])
        fInter.values = vals
      }
      app.save(interCol)
    } catch (_) {}
  },
)

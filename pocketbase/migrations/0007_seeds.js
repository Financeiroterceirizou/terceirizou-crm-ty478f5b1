migrate(
  (app) => {
    // Usuário admin inicial (trocar a senha no primeiro acesso)
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'admin@terceirizou.com.br')
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const record = new Record(users)
      record.setEmail('admin@terceirizou.com.br')
      record.setPassword('Terceirizou@2026')
      record.setVerified(true)
      record.set('name', 'Admin Terceirizou')
      record.set('role', 'admin')
      app.save(record)
    }

    // Planos por volume (valores de referência — ajustar no painel)
    const seedPlano = (nome, tipo, faixa, valor, servicos) => {
      try {
        app.findFirstRecordByData('planos', 'nome', nome)
      } catch (_) {
        const col = app.findCollectionByNameOrId('planos')
        const r = new Record(col)
        r.set('nome', nome)
        r.set('tipo', tipo)
        r.set('faixa_volume', faixa)
        r.set('valor_mensal', valor)
        r.set('servicos_inclusos', servicos)
        r.set('ativo', true)
        app.save(r)
      }
    }
    seedPlano(
      'Plano por Volume (Entrada)',
      'recorrente',
      'Até ~300 transações/mês (configurar faixas no painel)',
      1919,
      'Gestão de contas a pagar e a receber, lançamentos, agendamentos, emissão de NF e boletos, relatórios gerenciais.',
    )
    seedPlano(
      'Plano por Volume (Superior)',
      'recorrente',
      'Até ~300 transações/mês (configurar faixas no painel)',
      2549,
      'Gestão de contas a pagar e a receber, lançamentos, agendamentos, emissão de NF e boletos, relatórios gerenciais, consultoria financeira.',
    )
    seedPlano(
      'Plano Personalizado',
      'recorrente',
      'Mais de 3 contas ou mais de 300 transações/mês (valor sob consulta)',
      null,
      'Atendimento sob medida para operações maiores. Valor sob consulta.',
    )

    // Campanha 200 reuniões (01/09 a 31/12/2026)
    try {
      app.findFirstRecordByData('campanhas', 'nome', '200 Reuniões de Fechamento')
    } catch (_) {
      const col = app.findCollectionByNameOrId('campanhas')
      const r = new Record(col)
      r.set('nome', '200 Reuniões de Fechamento')
      r.set('data_inicio', '2026-09-01 00:00:00.000Z')
      r.set('data_fim', '2026-12-31 23:59:59.000Z')
      r.set('meta_reunioes', 200)
      r.set('meta_faturamento', 30000)
      r.set('status', 'ativa')
      app.save(r)
    }
  },
  (app) => {
    try {
      app.delete(app.findFirstRecordByData('campanhas', 'nome', '200 Reuniões de Fechamento'))
    } catch (_) {}
    try {
      app.delete(app.findFirstRecordByData('planos', 'nome', 'Plano Personalizado'))
    } catch (_) {}
    try {
      app.delete(app.findFirstRecordByData('planos', 'nome', 'Plano por Volume (Superior)'))
    } catch (_) {}
    try {
      app.delete(app.findFirstRecordByData('planos', 'nome', 'Plano por Volume (Entrada)'))
    } catch (_) {}
    try {
      app.delete(app.findAuthRecordByEmail('_pb_users_auth_', 'admin@terceirizou.com.br'))
    } catch (_) {}
  },
)

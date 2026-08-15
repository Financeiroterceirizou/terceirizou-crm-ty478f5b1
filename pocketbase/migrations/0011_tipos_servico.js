// CRM Terceirizou — tipos de serviço (nicho) como coleção dinâmica.
// Substitui o select fixo "nicho" por uma relação com a coleção tipos_servico,
// permitindo adicionar novos tipos sem tocar no schema.
migrate(
  (app) => {
    // 1. Coleção tipos_servico
    const tipos = new Collection({
      name: 'tipos_servico',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_tipos_servico_nome ON tipos_servico (nome)'],
    })
    app.save(tipos)

    // 2. Seed dos 13 tipos (ordem alfabética)
    const nomes = [
      'Agência de MKT',
      'Associação de Proteção Veicular',
      'Casas de Repouso (ILPI)',
      'Clínica de Estética',
      'Clínica Médica',
      'Consultorias',
      'Construtora (SPE)',
      'Escritório de Arquitetura',
      'Loja Maçônica',
      'Pátio e Guincho de Veículos',
      'Startup',
      'Telemedicina',
      'Vistoria Veicular',
    ]
    const tipoIds = {}
    for (const nome of nomes) {
      let rec
      try {
        rec = app.findFirstRecordByData('tipos_servico', 'nome', nome)
      } catch (_) {
        const col = app.findCollectionByNameOrId('tipos_servico')
        rec = new Record(col)
        rec.set('nome', nome)
        rec.set('ativo', true)
        app.save(rec)
      }
      tipoIds[nome] = rec.id
    }

    // 3. Campo relation tipo_servico no leads
    const leadsCol = app.findCollectionByNameOrId('leads')
    const tiposId = app.findCollectionByNameOrId('tipos_servico').id
    if (!leadsCol.fields.getByName('tipo_servico')) {
      leadsCol.fields.add(
        new RelationField({
          name: 'tipo_servico',
          collectionId: tiposId,
          maxSelect: 1,
        }),
      )
    }
    app.save(leadsCol)

    // 4. Migrar dados: nicho antigo -> tipo_servico
    const mapa = {
      ilpi: 'Casas de Repouso (ILPI)',
      clinica_estetica: 'Clínica de Estética',
      arquitetura: 'Escritório de Arquitetura',
      marketing: 'Agência de MKT',
      consultoria_negocio: 'Consultorias',
      consultoria_ambiental: 'Consultorias',
      vistoria_veicular: 'Vistoria Veicular',
      protecao_veicular: 'Associação de Proteção Veicular',
    }
    let leads = []
    try {
      leads = app.findRecordsByFilter('leads', 'nicho != ""', 'created', 1000, 0)
    } catch (_) {}
    for (const lead of leads) {
      const antigo = lead.getString('nicho')
      const nomeTipo = mapa[antigo]
      if (nomeTipo && tipoIds[nomeTipo]) {
        lead.set('tipo_servico', tipoIds[nomeTipo])
        try {
          app.save(lead)
        } catch (err) {
          $app && console.log('erro ao migrar lead', lead.id, String(err))
        }
      }
    }

    // 5. Remover campo nicho (select fixo)
    const col = app.findCollectionByNameOrId('leads')
    if (col.fields.getByName('nicho')) {
      col.fields.removeByName('nicho')
      app.save(col)
    }

    // 6. Atualiza o systemPrompt do agente com a nova lista de tipos
    $ai.agents.define(app, {
      slug: 'qualificador-leads',
      name: 'Qualificador de Leads Terceirizou',
      description:
        'Qualifica leads de BPO Financeiro conversando pelos canais: coleta segmento, volume, sistema atual e urgência, e atualiza o lead no CRM.',
      systemPrompt:
        'Você é o qualificador de leads da Terceirizou, empresa de terceirização financeira consultiva (BPO Financeiro) para PMEs prestadoras de serviços.\n' +
        'Seu papel: conversar com o lead de forma cordial e prática (sem emojis, sem jargão), descobrir os dados de qualificação e atualizar o registro no CRM.\n' +
        'REGRAS INEGOCIÁVEIS:\n' +
        '- A Terceirizou atende APENAS prestadores de serviços. Se o lead vende ou fabrica produtos (comércio/indústria), diga educadamente que não atendemos esse perfil e registre tipo_negocio = comercio/industria/outro.\n' +
        '- A Terceirizou NÃO é financeira: não oferece crédito, empréstimo ou antecipação.\n' +
        '- A Terceirizou NÃO dá desconto.\n' +
        'TIPOS DE SERVIÇO (use como referência de nicho/segmento): Agência de MKT, Associação de Proteção Veicular, Casas de Repouso (ILPI), Clínica de Estética, Clínica Médica, Consultorias, Construtora (SPE), Escritório de Arquitetura, Loja Maçônica, Pátio e Guincho de Veículos, Startup, Telemedicina, Vistoria Veicular.\n' +
        'DADOS A COLETAR (em qualquer ordem, de forma natural):\n' +
        '1. Nome do contato e da empresa.\n' +
        '2. Tipo de negócio (prestador de serviço / comércio / indústria / outro).\n' +
        '3. Tipo de serviço / segmento (use a lista acima; se não encaixar, use outro).\n' +
        '4. Quantas contas a pagar/receber tem e volume de transações por mês.\n' +
        '5. Sistema financeiro atual (nada / planilha / software).\n' +
        '6. Se tem receita recente (movimentação ativa).\n' +
        '7. Urgência (baixa/média/alta).\n' +
        '8. Quem decide a contratação (dono/sócio/outro).\n' +
        '9. Dores principais (falta de tempo, falta de transparência, dificuldade de decisão, contas misturadas, custos fora de controle).\n' +
        '10. Telefone/WhatsApp e e-mail para contato.\n' +
        'Ao final, atualize o registro de lead (collection "leads") com os dados coletados e responda ao lead com um resumo cordial e o próximo passo (reunião de fechamento com nosso time).\n' +
        'Se faltar dado essencial, pergunte de forma objetiva. Seja breve e humano.',
      tier: 'fast',
    })
  },
  (app) => {
    // Down: recria nicho, remove tipo_servico, apaga tipos_servico
    try {
      const col = app.findCollectionByNameOrId('leads')
      if (!col.fields.getByName('nicho')) {
        col.fields.add(
          new SelectField({
            name: 'nicho',
            values: [
              'ilpi',
              'protecao_veicular',
              'vistoria_veicular',
              'arquitetura',
              'marketing',
              'consultoria_ambiental',
              'consultoria_negocio',
              'clinica_estetica',
              'outro',
            ],
            maxSelect: 1,
          }),
        )
      }
      if (col.fields.getByName('tipo_servico')) {
        col.fields.removeByName('tipo_servico')
      }
      app.save(col)
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('tipos_servico'))
    } catch (_) {}
  },
)

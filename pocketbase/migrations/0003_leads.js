migrate(
  (app) => {
    const usersId = '_pb_users_auth_'
    const campanhasId = app.findCollectionByNameOrId('campanhas').id
    const leads = new Collection({
      name: 'leads',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'vendedor')",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'vendedor')",
      createRule: "@request.auth.id != ''",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'vendedor')",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'empresa', type: 'text', required: true },
        { name: 'cnpj', type: 'text' },
        { name: 'telefone', type: 'text', required: true },
        { name: 'email', type: 'email' },
        { name: 'cidade', type: 'text' },
        { name: 'uf', type: 'text', max: 2 },
        {
          name: 'unidade',
          type: 'select',
          values: ['floripa', 'tubarao'],
          maxSelect: 1,
        },
        {
          name: 'canal_origem',
          type: 'select',
          values: [
            'instagram',
            'facebook',
            'linkedin',
            'email',
            'whatsapp',
            'telegram',
            'indicacao',
          ],
          maxSelect: 1,
          required: true,
        },
        { name: 'indicado_por', type: 'text' },
        {
          name: 'tipo_negocio',
          type: 'select',
          values: ['prestador_servico', 'comercio', 'industria', 'outro'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'nicho',
          type: 'select',
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
        },
        { name: 'faturamento_mensal', type: 'number' },
        { name: 'num_funcionarios', type: 'number' },
        { name: 'num_contas', type: 'number' },
        { name: 'volume_transacoes', type: 'number' },
        { name: 'sistema_atual', type: 'text' },
        { name: 'receita_recente', type: 'bool' },
        { name: 'decisor', type: 'text' },
        {
          name: 'urgencia',
          type: 'select',
          values: ['baixa', 'media', 'alta'],
          maxSelect: 1,
        },
        {
          name: 'dores',
          type: 'select',
          values: [
            'falta_tempo',
            'falta_transparencia',
            'dificuldade_decisao',
            'contas_misturadas',
            'custos_fora_controle',
          ],
          maxSelect: 5,
        },
        { name: 'ticket_estimado', type: 'number' },
        { name: 'responsavel', type: 'relation', collectionId: usersId, maxSelect: 1 },
        {
          name: 'etapa',
          type: 'select',
          values: [
            'novo',
            'qualificado',
            'primeiro_contato',
            'reuniao_agendada',
            'reuniao_realizada',
            'proposta_enviada',
            'negociacao',
            'cliente',
            'perdido',
            'descartado',
          ],
          maxSelect: 1,
        },
        { name: 'score', type: 'number' },
        {
          name: 'prioridade',
          type: 'select',
          values: ['baixa', 'media', 'alta'],
          maxSelect: 1,
        },
        { name: 'motivo_perda', type: 'text' },
        { name: 'motivo_descarte', type: 'text' },
        { name: 'campanha', type: 'relation', collectionId: campanhasId, maxSelect: 1 },
        { name: 'consentimento_lgpd', type: 'bool' },
        { name: 'data_consentimento', type: 'date' },
        { name: 'canal_consentimento', type: 'text' },
        { name: 'solicitou_exclusao', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_leads_etapa ON leads (etapa)',
        'CREATE INDEX idx_leads_canal ON leads (canal_origem)',
        'CREATE INDEX idx_leads_telefone ON leads (telefone)',
        'CREATE INDEX idx_leads_cnpj ON leads (cnpj)',
        'CREATE INDEX idx_leads_email ON leads (email)',
        'CREATE INDEX idx_leads_responsavel_created ON leads (responsavel, created)',
      ],
    })
    app.save(leads)
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('leads'))
    } catch (_) {}
  },
)

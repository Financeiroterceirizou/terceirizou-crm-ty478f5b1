/* Detalhe do lead: informações, timeline de interações, reuniões e propostas. */
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'

const ETAPA_LABEL: Record<string, string> = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  primeiro_contato: 'Primeiro contato',
  reuniao_agendada: 'Reunião agendada',
  reuniao_realizada: 'Reunião realizada',
  proposta_enviada: 'Proposta enviada',
  negociacao: 'Negociação',
  cliente: 'Cliente',
  perdido: 'Perdido',
  descartado: 'Descartado',
}

const ETAPAS = Object.keys(ETAPA_LABEL)

const CANAL_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  indicacao: 'Indicação',
  reuniao: 'Reunião',
  ligacao: 'Ligação',
}

const NICHO_LABEL: Record<string, string> = {
  ilpi: 'Casa de Repouso (ILPI)',
  protecao_veicular: 'Proteção Veicular',
  vistoria_veicular: 'Vistoria Veicular',
  arquitetura: 'Arquitetura',
  marketing: 'Marketing',
  consultoria_ambiental: 'Consultoria Ambiental',
  consultoria_negocio: 'Consultoria de Negócio',
  clinica_estetica: 'Clínica de Estética',
  outro: 'Outro',
}

const LeadDetalhe = () => {
  const { id } = useParams()
  const [lead, setLead] = useState<any>(null)
  const [interacoes, setInteracoes] = useState<any[]>([])
  const [reunioes, setReunioes] = useState<any[]>([])
  const [propostas, setPropostas] = useState<any[]>([])
  const [erro, setErro] = useState('')
  const [novaInteracao, setNovaInteracao] = useState({
    resumo: '',
    canal: 'whatsapp',
    tipo: 'saida',
  })

  useEffect(() => {
    const carregar = async () => {
      try {
        const [l, i, r, p] = await Promise.all([
          pb.collection('leads').getOne(id!),
          pb
            .collection('interacoes')
            .getList(1, 100, { filter: `lead="${id}"`, sort: '-data_hora' }),
          pb.collection('reunioes').getList(1, 50, { filter: `lead="${id}"`, sort: '-data_hora' }),
          pb.collection('propostas').getList(1, 50, { filter: `lead="${id}"`, sort: '-created' }),
        ])
        setLead(l)
        setInteracoes(i.items)
        setReunioes(r.items)
        setPropostas(p.items)
      } catch (e: any) {
        setErro(e.message || 'Erro ao carregar lead')
      }
    }
    if (pb.authStore.isValid) carregar()
  }, [id])

  const moverEtapa = async (etapa: string) => {
    try {
      await pb.collection('leads').update(id!, { etapa })
      setLead((prev: any) => ({ ...prev, etapa }))
    } catch (e: any) {
      setErro(e.message || 'Erro ao mover etapa')
    }
  }

  const registrarInteracao = async (ev: React.FormEvent) => {
    ev.preventDefault()
    try {
      await pb.collection('interacoes').create({
        lead: id,
        canal: novaInteracao.canal,
        tipo: novaInteracao.tipo,
        data_hora: new Date().toISOString(),
        resumo: novaInteracao.resumo,
      })
      const i = await pb
        .collection('interacoes')
        .getList(1, 100, { filter: `lead="${id}"`, sort: '-data_hora' })
      setInteracoes(i.items)
      setNovaInteracao({ resumo: '', canal: 'whatsapp', tipo: 'saida' })
    } catch (e: any) {
      setErro(e.message || 'Erro ao registrar interação')
    }
  }

  if (erro && !lead) return <div className="p-8 text-red-600">{erro}</div>
  if (!lead) return <div className="p-8 text-slate-500">Carregando…</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-lg font-bold text-slate-800">
              Terceirizou CRM
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link to="/" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link to="/leads" className="text-slate-600 hover:text-slate-900">
                Leads
              </Link>
              <Link to="/clientes" className="text-slate-600 hover:text-slate-900">
                Clientes
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {erro && <p className="text-sm text-red-600 mb-4">{erro}</p>}

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{lead.nome}</h1>
              <p className="text-slate-600">{lead.empresa}</p>
              <p className="text-sm text-slate-500 mt-1">
                {CANAL_LABEL[lead.canal_origem] || lead.canal_origem}
                {lead.nicho ? ` · ${NICHO_LABEL[lead.nicho] || lead.nicho}` : ''}
                {lead.cidade ? ` · ${lead.cidade}${lead.uf ? '/' + lead.uf : ''}` : ''}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${(lead.score || 0) >= 60 ? 'bg-emerald-100 text-emerald-700' : (lead.score || 0) >= 35 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
              >
                Score {lead.score ?? 0}
              </span>
              <p className="text-xs text-slate-500 mt-2">
                {lead.telefone}
                {lead.email ? ` · ${lead.email}` : ''}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-500">Etapa:</span>
            <select
              value={lead.etapa}
              onChange={(ev) => moverEtapa(ev.target.value)}
              className="text-sm rounded-lg border border-slate-300 px-2 py-1"
            >
              {ETAPAS.map((e) => (
                <option key={e} value={e}>
                  {ETAPA_LABEL[e]}
                </option>
              ))}
            </select>
            {lead.motivo_descarte && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {lead.motivo_descarte}
              </span>
            )}
            {lead.motivo_perda && (
              <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {lead.motivo_perda}
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Faturamento mensal</p>
              <p className="font-medium text-slate-800">
                {lead.faturamento_mensal
                  ? 'R$ ' + Number(lead.faturamento_mensal).toLocaleString('pt-BR')
                  : '—'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Transações/mês</p>
              <p className="font-medium text-slate-800">{lead.volume_transacoes || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Sistema atual</p>
              <p className="font-medium text-slate-800">{lead.sistema_atual || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">Urgência</p>
              <p className="font-medium text-slate-800 capitalize">{lead.urgencia || '—'}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-3">Registrar interação</h2>
            <form onSubmit={registrarInteracao} className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={novaInteracao.canal}
                  onChange={(ev) => setNovaInteracao({ ...novaInteracao, canal: ev.target.value })}
                  className="text-sm rounded-lg border border-slate-300 px-2 py-2"
                >
                  {Object.entries(CANAL_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <select
                  value={novaInteracao.tipo}
                  onChange={(ev) => setNovaInteracao({ ...novaInteracao, tipo: ev.target.value })}
                  className="text-sm rounded-lg border border-slate-300 px-2 py-2"
                >
                  <option value="saida">Saída</option>
                  <option value="entrada">Entrada</option>
                </select>
              </div>
              <textarea
                value={novaInteracao.resumo}
                onChange={(ev) => setNovaInteracao({ ...novaInteracao, resumo: ev.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Resumo da interação…"
                required
              />
              <button className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 text-sm">
                Registrar
              </button>
            </form>

            <h2 className="font-semibold text-slate-800 mt-6 mb-3">Timeline</h2>
            {interacoes.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma interação registrada.</p>
            ) : (
              <ul className="space-y-3">
                {interacoes.map((i) => (
                  <li key={i.id} className="border-b border-slate-100 pb-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {CANAL_LABEL[i.canal] || i.canal} ·{' '}
                        {i.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                      <span>{new Date(i.data_hora).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-slate-700 mt-1">{i.resumo}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-3">Reuniões</h2>
              {reunioes.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma reunião.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {reunioes.map((r) => (
                    <li key={r.id} className="border-b border-slate-100 pb-2">
                      <p className="text-slate-700">
                        {new Date(r.data_hora).toLocaleString('pt-BR')} · {r.formato || '—'}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">
                        {r.status} {r.resultado ? `· ${r.resultado}` : ''}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-3">Propostas</h2>
              {propostas.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma proposta.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {propostas.map((p) => (
                    <li key={p.id} className="border-b border-slate-100 pb-2 flex justify-between">
                      <span className="text-slate-700">
                        R$ {Number(p.valor_mensal).toLocaleString('pt-BR')}
                      </span>
                      <span className="text-xs text-slate-500 capitalize">{p.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default LeadDetalhe

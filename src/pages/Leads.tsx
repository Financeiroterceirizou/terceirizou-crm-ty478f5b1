/* Página de Leads: kanban por etapa com movimentação e filtro por canal. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'

const ETAPAS = [
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
]

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

const CANAL_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  indicacao: 'Indicação',
}

const ETAPA_COR: Record<string, string> = {
  novo: 'bg-slate-100',
  qualificado: 'bg-blue-50',
  primeiro_contato: 'bg-cyan-50',
  reuniao_agendada: 'bg-indigo-50',
  reuniao_realizada: 'bg-violet-50',
  proposta_enviada: 'bg-amber-50',
  negociacao: 'bg-orange-50',
  cliente: 'bg-emerald-50',
  perdido: 'bg-red-50',
  descartado: 'bg-slate-50',
}

const Leads = () => {
  const [leads, setLeads] = useState<any[]>([])
  const [filtroCanal, setFiltroCanal] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await pb.collection('leads').getList(1, 300, { sort: '-created' })
        setLeads(lista.items)
      } catch (e: any) {
        setErro(e.message || 'Erro ao carregar leads')
      }
    }
    if (pb.authStore.isValid) carregar()
  }, [])

  const mover = async (leadId: string, etapa: string) => {
    try {
      await pb.collection('leads').update(leadId, { etapa })
      setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, etapa } : l)))
    } catch (e: any) {
      setErro(e.message || 'Erro ao mover lead')
    }
  }

  const filtrados = filtroCanal ? leads.filter((l) => l.canal_origem === filtroCanal) : leads

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
              <span className="text-emerald-700 font-medium">Leads</span>
              <Link to="/clientes" className="text-slate-600 hover:text-slate-900">
                Clientes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filtroCanal}
              onChange={(ev) => setFiltroCanal(ev.target.value)}
              className="text-sm rounded-lg border border-slate-300 px-2 py-1"
            >
              <option value="">Todos os canais</option>
              {Object.entries(CANAL_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-600">{filtrados.length} leads</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {erro && <p className="text-sm text-red-600 mb-4">{erro}</p>}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {ETAPAS.map((etapa) => {
            const itens = filtrados.filter((l) => l.etapa === etapa)
            return (
              <div
                key={etapa}
                className={`min-w-[240px] flex-1 rounded-xl border border-slate-200 p-3 ${ETAPA_COR[etapa]}`}
              >
                <h3 className="font-semibold text-sm text-slate-700 mb-3 flex items-center justify-between">
                  <span>{ETAPA_LABEL[etapa]}</span>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 border border-slate-200">
                    {itens.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {itens.map((l) => (
                    <div
                      key={l.id}
                      className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm"
                    >
                      <Link to={`/leads/${l.id}`} className="block">
                        <p className="font-medium text-sm text-slate-800 truncate">{l.nome}</p>
                        <p className="text-xs text-slate-500 truncate">{l.empresa}</p>
                      </Link>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-500">
                          {CANAL_LABEL[l.canal_origem] || l.canal_origem}
                        </span>
                        <span
                          className={`text-xs font-medium px-1.5 py-0.5 rounded ${(l.score || 0) >= 60 ? 'bg-emerald-100 text-emerald-700' : (l.score || 0) >= 35 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {l.score ?? 0}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-1">
                        <select
                          value={l.etapa}
                          onChange={(ev) => mover(l.id, ev.target.value)}
                          className="w-full text-xs rounded border border-slate-200 px-1 py-1 bg-white"
                        >
                          {ETAPAS.map((e) => (
                            <option key={e} value={e}>
                              {ETAPA_LABEL[e]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {itens.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">—</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default Leads

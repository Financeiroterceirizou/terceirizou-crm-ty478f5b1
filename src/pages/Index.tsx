/* Página inicial do CRM Terceirizou: login + visão geral (dashboard). */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'

const ETAPA_LABEL: Record<string, string> = {
  novo: 'Novo',
  qualificado: 'Qualificado',
  primeiro_contato: 'Primeiro contato',
  reuniao_agendada: 'Reunião agendada',
  reuniao_realizada: 'Reunião realizada',
  proposta_enviada: 'Proposta enviada',
  negociacao: 'Negociação',
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

const Index = () => {
  const [authed, setAuthed] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [leads, setLeads] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [reunioes, setReunioes] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (pb.authStore.isValid) setAuthed(true)
  }, [])

  useEffect(() => {
    if (!authed) return
    const carregar = async () => {
      setCarregando(true)
      try {
        const [l, c, r] = await Promise.all([
          pb.collection('leads').getList(1, 200, { sort: '-created' }),
          pb.collection('clientes').getList(1, 200, { sort: '-created' }),
          pb.collection('reunioes').getList(1, 200, { sort: '-data_hora' }),
        ])
        setLeads(l.items)
        setClientes(c.items)
        setReunioes(r.items)
      } catch (e: any) {
        setErro(e.message || 'Erro ao carregar dados')
      }
      setCarregando(false)
    }
    carregar()
  }, [authed])

  const entrar = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setErro('')
    try {
      await pb.collection('users').authWithPassword(email, password)
      setAuthed(true)
    } catch (e: any) {
      setErro(e.message || 'Falha no login')
    }
  }

  const sair = () => {
    pb.authStore.clear()
    setAuthed(false)
    setLeads([])
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Terceirizou CRM</h1>
          <p className="text-sm text-slate-500 mb-6">
            Gestão de leads, clientes e receita recorrente
          </p>
          <form onSubmit={entrar} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="voce@empresa.com.br"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="••••••••"
                required
              />
            </div>
            {erro && <p className="text-sm text-red-600">{erro}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 text-sm"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  const ativos = leads.filter((l) => !['cliente', 'perdido', 'descartado'].includes(l.etapa))
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const leadsNoMes = leads.filter(
    (l) => new Date(l.created) >= inicioMes && !['cliente', 'descartado'].includes(l.etapa),
  ).length
  const emReuniao = leads.filter((l) => l.etapa === 'reuniao_agendada').length
  const emProposta = leads.filter((l) =>
    ['proposta_enviada', 'negociacao'].includes(l.etapa),
  ).length
  const clientesAtivos = clientes.filter((c) => c.status_contrato !== 'cancelado').length
  const mrr = clientes
    .filter((c) => c.status_contrato !== 'cancelado')
    .reduce((soma, c) => soma + (c.valor_mensal || 0), 0)
  const proxReunioes = reunioes
    .filter((r) => r.status === 'agendada' && new Date(r.data_hora) > new Date())
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
    .slice(0, 5)

  const card = (titulo: string, valor: string | number, cor: string) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{titulo}</p>
      <p className={`text-2xl font-bold mt-1 ${cor}`}>{valor}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-slate-800">Terceirizou CRM</h1>
            <nav className="flex items-center gap-4 text-sm">
              <span className="text-emerald-700 font-medium">Dashboard</span>
              <Link to="/leads" className="text-slate-600 hover:text-slate-900">
                Leads
              </Link>
              <Link to="/clientes" className="text-slate-600 hover:text-slate-900">
                Clientes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{pb.authStore.model?.email}</span>
            <button onClick={sair} className="text-sm text-red-600 hover:text-red-800">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {carregando ? (
          <p className="text-slate-500">Carregando…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {card('Leads ativos', ativos.length, 'text-slate-800')}
              {card('Em reunião', emReuniao, 'text-blue-600')}
              {card('Em proposta', emProposta, 'text-amber-600')}
              {card('MRR (R$)', mrr.toLocaleString('pt-BR'), 'text-emerald-700')}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {card('Clientes ativos', clientesAtivos, 'text-slate-800')}
              {card('Leads no mês', leadsNoMes, 'text-slate-800')}
              {card(
                'Score médio',
                ativos.length
                  ? Math.round(ativos.reduce((s, l) => s + (l.score || 0), 0) / ativos.length)
                  : 0,
                'text-slate-800',
              )}
              {card(
                'Ticket médio (R$)',
                clientesAtivos ? Math.round(mrr / clientesAtivos) : 0,
                'text-slate-800',
              )}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h2 className="font-semibold text-slate-800 mb-3">Leads por etapa</h2>
                <div className="space-y-2">
                  {Object.entries(ETAPA_LABEL).map(([etapa, label]) => {
                    const qtd = leads.filter((l) => l.etapa === etapa).length
                    if (qtd === 0) return null
                    return (
                      <div key={etapa} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{label}</span>
                        <span className="font-medium text-slate-800">{qtd}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <h2 className="font-semibold text-slate-800 mb-3">Próximas reuniões</h2>
                {proxReunioes.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhuma reunião agendada.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {proxReunioes.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between border-b border-slate-100 pb-2"
                      >
                        <span className="text-slate-700">
                          {new Date(r.data_hora).toLocaleDateString('pt-BR')}{' '}
                          {new Date(r.data_hora).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-slate-500">{r.formato || '—'}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h2 className="font-semibold text-slate-800 mb-3">Últimos leads</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-2 pr-4">Nome</th>
                      <th className="py-2 pr-4">Empresa</th>
                      <th className="py-2 pr-4">Canal</th>
                      <th className="py-2 pr-4">Etapa</th>
                      <th className="py-2 pr-4">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 10).map((l) => (
                      <tr key={l.id} className="border-b border-slate-100">
                        <td className="py-2 pr-4 font-medium text-slate-800">{l.nome}</td>
                        <td className="py-2 pr-4 text-slate-600">{l.empresa}</td>
                        <td className="py-2 pr-4 text-slate-600">
                          {CANAL_LABEL[l.canal_origem] || l.canal_origem}
                        </td>
                        <td className="py-2 pr-4 text-slate-600">
                          {ETAPA_LABEL[l.etapa] || l.etapa}
                        </td>
                        <td className="py-2 pr-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${(l.score || 0) >= 60 ? 'bg-emerald-100 text-emerald-700' : (l.score || 0) >= 35 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}
                          >
                            {l.score ?? 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Index

/* Clientes: lista de clientes ativos com status, valor e saúde. */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo',
  inadimplente: 'Inadimplente',
  cancelado: 'Cancelado',
}

const LeadDetalheUnused = () => null

const Clientes = () => {
  const [clientes, setClientes] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    const carregar = async () => {
      try {
        const [c, l] = await Promise.all([
          pb.collection('clientes').getList(1, 300, { sort: '-created' }),
          pb.collection('leads').getList(1, 300, { sort: '-created' }),
        ])
        setClientes(c.items)
        setLeads(l.items)
      } catch (e: any) {
        setErro(e.message || 'Erro ao carregar clientes')
      }
    }
    if (pb.authStore.isValid) carregar()
  }, [])

  const leadPorId = (id: string) => leads.find((l) => l.id === id)
  const clientesOrdenados = [...clientes].sort((a, b) => {
    const nomeA = (leadPorId(a.lead)?.nome || '').toLowerCase()
    const nomeB = (leadPorId(b.lead)?.nome || '').toLowerCase()
    return nomeA.localeCompare(nomeB, 'pt-BR')
  })

  const mrr = clientes
    .filter((c) => c.status_contrato !== 'cancelado')
    .reduce((soma, c) => soma + (c.valor_mensal || 0), 0)
  const inadimplentes = clientes.filter((c) => c.status_contrato === 'inadimplente').length

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
              <span className="text-emerald-700 font-medium">Clientes</span>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {erro && <p className="text-sm text-red-600 mb-4">{erro}</p>}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase">Clientes ativos</p>
            <p className="text-2xl font-bold text-slate-800">
              {clientes.filter((c) => c.status_contrato === 'ativo').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase">MRR (R$)</p>
            <p className="text-2xl font-bold text-emerald-700">{mrr.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500 uppercase">Inadimplentes</p>
            <p className="text-2xl font-bold text-amber-600">{inadimplentes}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Plano</th>
                  <th className="py-3 px-4">Valor (R$)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Saúde</th>
                  <th className="py-3 px-4">Início</th>
                </tr>
              </thead>
              <tbody>
                {clientesOrdenados.map((c) => {
                  const lead = leadPorId(c.lead)
                  return (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        {lead ? (
                          <Link
                            to={`/leads/${lead.id}`}
                            className="font-medium text-slate-800 hover:text-emerald-700 hover:underline"
                          >
                            {lead.nome || '—'}
                          </Link>
                        ) : (
                          <span className="font-medium text-slate-800">—</span>
                        )}
                        <span className="block text-xs text-slate-500">{lead?.empresa || ''}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{c.plano ? 'Plano' : '—'}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {Number(c.valor_mensal).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.status_contrato === 'ativo' ? 'bg-emerald-100 text-emerald-700' : c.status_contrato === 'inadimplente' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {STATUS_LABEL[c.status_contrato] || c.status_contrato}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${(c.score_saude || 0) >= 70 ? 'bg-emerald-100 text-emerald-700' : (c.score_saude || 0) >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {c.score_saude ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {c.data_inicio ? new Date(c.data_inicio).toLocaleDateString('pt-BR') : '—'}
                      </td>
                    </tr>
                  )
                })}
                {clientes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Nenhum cliente ainda. Aceite uma proposta para abrir a operação.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Clientes

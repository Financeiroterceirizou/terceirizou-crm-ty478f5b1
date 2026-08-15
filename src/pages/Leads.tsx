/* Página de Leads: kanban por etapa, filtro por canal e tipo de serviço, e criação manual de lead.
   Tipo de serviço é dinâmico (coleção tipos_servico) com botão para incluir novos. */
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
  'cliente_hold',
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
  cliente_hold: 'Cliente Hold',
  perdido: 'Perdido',
  descartado: 'Descartado',
}

const CANAL_LABEL: Record<string, string> = {
  meta: 'Meta',
  linkedin: 'LinkedIn',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  indicacao: 'Indicação',
  banco_cora: 'Banco Cora',
}

const DOR_LABEL: Record<string, string> = {
  falta_tempo: 'Falta de tempo',
  falta_transparencia: 'Falta de transparência',
  dificuldade_decisao: 'Dificuldade de decisão',
  contas_misturadas: 'Contas misturadas',
  custos_fora_controle: 'Custos fora de controle',
}

const ETAPA_COR: Record<string, string> = {
  novo: 'bg-slate-100',
  qualificado: 'bg-blue-50',
  primeiro_contato: 'bg-cyan-50',
  reuniao_agendada: 'bg-indigo-50',
  reuniao_realizada: 'bg-violet-50',
  proposta_enviada: 'bg-amber-50',
  negociacao: 'bg-orange-50',
  cliente_hold: 'bg-teal-50',
  perdido: 'bg-red-50',
  descartado: 'bg-slate-50',
}

const FORM_INICIAL = {
  nome: '',
  empresa: '',
  telefone: '',
  email: '',
  cidade: '',
  uf: '',
  canal_origem: 'whatsapp',
  tipo_negocio: 'prestador_servico',
  tipo_servico: '',
  sistema_atual: '',
  indicado_por: '',
  observacao: '',
  dores: [] as string[],
}

const Leads = () => {
  const [leads, setLeads] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const [filtroCanal, setFiltroCanal] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [erro, setErro] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ ...FORM_INICIAL })
  const [salvando, setSalvando] = useState(false)
  const [novoTipo, setNovoTipo] = useState('')
  const [salvandoTipo, setSalvandoTipo] = useState(false)

  const ordenaTipos = (arr: any[]) => [...arr].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const carregar = async () => {
    try {
      const [lista, tiposLista] = await Promise.all([
        pb.collection('leads').getList(1, 300, { sort: '-created' }),
        pb.collection('tipos_servico').getList(1, 100, { sort: 'nome' }),
      ])
      setLeads(lista.items)
      setTipos(ordenaTipos(tiposLista.items))
    } catch (e: any) {
      setErro(e.message || 'Erro ao carregar dados')
    }
  }

  useEffect(() => {
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

  const toggleDor = (dor: string) => {
    setForm((prev) => ({
      ...prev,
      dores: prev.dores.includes(dor) ? prev.dores.filter((d) => d !== dor) : [...prev.dores, dor],
    }))
  }

  const criarTipo = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const nome = novoTipo.trim()
    if (!nome) return
    setSalvandoTipo(true)
    setErro('')
    try {
      const criado = await pb.collection('tipos_servico').create({ nome, ativo: true })
      setTipos((prev) => ordenaTipos([...prev, criado]))
      setForm((prev) => ({ ...prev, tipo_servico: criado.id }))
      setNovoTipo('')
    } catch (e: any) {
      setErro(e.message || 'Erro ao criar tipo de serviço')
    }
    setSalvandoTipo(false)
  }

  const criarLead = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      const payload: any = {
        nome: form.nome.trim(),
        empresa: form.empresa.trim(),
        telefone: form.telefone.trim(),
        canal_origem: form.canal_origem,
        tipo_negocio: form.tipo_negocio,
        dores: form.dores,
      }
      if (form.tipo_servico) payload.tipo_servico = form.tipo_servico
      if (form.email.trim()) payload.email = form.email.trim()
      if (form.cidade.trim()) payload.cidade = form.cidade.trim()
      if (form.uf.trim()) payload.uf = form.uf.trim().toUpperCase()
      if (form.sistema_atual.trim()) payload.sistema_atual = form.sistema_atual.trim()
      if (form.canal_origem === 'indicacao' && form.indicado_por.trim()) {
        payload.indicado_por = form.indicado_por.trim()
      }

      const novo = await pb.collection('leads').create(payload)

      if (form.observacao.trim()) {
        await pb.collection('interacoes').create({
          lead: novo.id,
          canal: form.canal_origem,
          tipo: 'entrada',
          data_hora: new Date().toISOString(),
          resumo: form.observacao.trim(),
        })
      }

      setForm({ ...FORM_INICIAL })
      setMostrarForm(false)
      await carregar()
    } catch (e: any) {
      setErro(e.message || 'Erro ao criar lead')
    }
    setSalvando(false)
  }

  const filtrados = leads
    .filter((l) => {
      const porCanal = filtroCanal ? l.canal_origem === filtroCanal : true
      const porTipo = filtroTipo ? l.tipo_servico === filtroTipo : true
      return porCanal && porTipo
    })
    .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'))
  const tipoPorId = (id: string) => tipos.find((t) => t.id === id)

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
            <select
              value={filtroTipo}
              onChange={(ev) => setFiltroTipo(ev.target.value)}
              className="text-sm rounded-lg border border-slate-300 px-2 py-1"
            >
              <option value="">Todos os tipos</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-600">{filtrados.length} leads</span>
            <button
              onClick={() => {
                setErro('')
                setMostrarForm(true)
              }}
              className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 text-sm"
            >
              + Novo Lead
            </button>
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
                          {l.tipo_servico && tipoPorId(l.tipo_servico)
                            ? ` · ${tipoPorId(l.tipo_servico).nome}`
                            : ''}
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

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Novo Lead</h2>
              <button
                onClick={() => setMostrarForm(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={criarLead} className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.nome}
                    onChange={(ev) => setForm({ ...form, nome: ev.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.empresa}
                    onChange={(ev) => setForm({ ...form, empresa: ev.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Telefone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.telefone}
                    onChange={(ev) => setForm({ ...form, telefone: ev.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="(48) 99999-9999"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(ev) => setForm({ ...form, email: ev.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Canal de origem <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.canal_origem}
                    onChange={(ev) => setForm({ ...form, canal_origem: ev.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    {Object.entries(CANAL_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de negócio <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.tipo_negocio}
                    onChange={(ev) => setForm({ ...form, tipo_negocio: ev.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="prestador_servico">Prestador de serviço</option>
                    <option value="comercio">Comércio</option>
                    <option value="industria">Indústria</option>
                    <option value="outro">Outro</option>
                  </select>
                  {form.tipo_negocio !== 'prestador_servico' && (
                    <p className="text-xs text-amber-600 mt-1">
                      Atenção: a Terceirizou não atende quem vende/fabrica produtos. O lead será
                      descartado automaticamente.
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de serviço
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.tipo_servico}
                      onChange={(ev) => setForm({ ...form, tipo_servico: ev.target.value })}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Selecione…</option>
                      {tipos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setNovoTipo(novoTipo === '' ? ' ' : '')}
                      className="rounded-lg border border-emerald-300 text-emerald-700 px-3 py-2 text-sm whitespace-nowrap hover:bg-emerald-50"
                      title="Incluir novo tipo de serviço"
                    >
                      + Novo tipo
                    </button>
                  </div>
                  {novoTipo !== '' && (
                    <form
                      onSubmit={criarTipo}
                      className="mt-2 flex gap-2 items-center"
                      onClick={(ev) => ev.stopPropagation()}
                    >
                      <input
                        value={novoTipo === ' ' ? '' : novoTipo}
                        onChange={(ev) => setNovoTipo(ev.target.value)}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        placeholder="Nome do novo tipo de serviço"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={salvandoTipo}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-sm disabled:opacity-50"
                      >
                        Salvar
                      </button>
                    </form>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                  <input
                    value={form.cidade}
                    onChange={(ev) => setForm({ ...form, cidade: ev.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                  <input
                    value={form.uf}
                    onChange={(ev) => setForm({ ...form, uf: ev.target.value })}
                    maxLength={2}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="SC"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sistema financeiro atual
                  </label>
                  <input
                    value={form.sistema_atual}
                    onChange={(ev) => setForm({ ...form, sistema_atual: ev.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Nenhum, Planilha, Software…"
                  />
                </div>
              </div>

              {form.canal_origem === 'indicacao' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Indicado por (nome/empresa)
                  </label>
                  <input
                    value={form.indicado_por}
                    onChange={(ev) => setForm({ ...form, indicado_por: ev.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Quem indicou o contato?"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dores</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(DOR_LABEL).map(([k, v]) => (
                    <label
                      key={k}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm cursor-pointer ${
                        form.dores.includes(k)
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.dores.includes(k)}
                        onChange={() => toggleDor(k)}
                        className="hidden"
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Observação (vira a primeira interação)
                </label>
                <textarea
                  value={form.observacao}
                  onChange={(ev) => setForm({ ...form, observacao: ev.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  rows={3}
                  placeholder="Contexto do contato, como chegou, o que precisa…"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMostrarForm(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 text-sm disabled:opacity-50"
                >
                  {salvando ? 'Salvando…' : 'Criar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Leads

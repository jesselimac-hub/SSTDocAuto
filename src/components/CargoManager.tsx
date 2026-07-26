import React, { useState } from 'react';
import { Briefcase, Plus, ShieldAlert, BookOpen, CheckCircle, AlertCircle, Pencil, Trash2, X, Save } from 'lucide-react';
import { Cargo } from '../types';
import { apiFetch } from '../lib/api';

interface Props {
  cargos: Cargo[];
  onCargoAdded: () => void;
}

export const CargoManager: React.FC<Props> = ({ cargos, onCargoAdded }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [nome, setNome] = useState('');
  const [cbo, setCbo] = useState('');
  const [riscosInput, setRiscosInput] = useState('');
  const [treinamentosInput, setTreinamentosInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado para Edição/Renomeação de cargo
  const [editingCargoId, setEditingCargoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCbo, setEditCbo] = useState('');
  const [editRiscos, setEditRiscos] = useState('');
  const [editTreinamentos, setEditTreinamentos] = useState('');

  const handleAddCargo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!nome.trim() || !cbo.trim()) {
      setError('Nome e CBO são campos obrigatórios.');
      setLoading(false);
      return;
    }

    const riscosArray = riscosInput
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean);

    const treinamentosArray = treinamentosInput
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      const res = await apiFetch('/api/cargos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          cbo,
          riscos: riscosArray.length > 0 ? riscosArray : ['Riscos sob análise técnica de SST'],
          treinamentos: treinamentosArray.length > 0 ? treinamentosArray : ['NR-01 Integração Geral de SST']
        })
      });

      if (!res.ok) {
        throw new Error('Erro ao salvar cargo no banco.');
      }

      setSuccess(`Cargo '${nome}' cadastrado com sucesso! Template .docx gerado automaticamente.`);
      setNome('');
      setCbo('');
      setRiscosInput('');
      setTreinamentosInput('');
      setShowAddForm(false);
      onCargoAdded();
    } catch (err: any) {
      setError(err.message || 'Falha ao cadastrar cargo.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (cargo: Cargo) => {
    setEditingCargoId(cargo.id);
    setEditNome(cargo.nome);
    setEditCbo(cargo.cbo);
    setEditRiscos(Array.isArray(cargo.riscos) ? cargo.riscos.join('\n') : '');
    setEditTreinamentos(Array.isArray(cargo.treinamentos) ? cargo.treinamentos.join('\n') : '');
  };

  const cancelEdit = () => {
    setEditingCargoId(null);
    setEditNome('');
    setEditCbo('');
    setEditRiscos('');
    setEditTreinamentos('');
  };

  const handleSaveEdit = async (id: number) => {
    if (!editNome.trim() || !editCbo.trim()) {
      setError('Nome e CBO são campos obrigatórios para o cargo.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const riscosArray = editRiscos
      .split('\n')
      .map(r => r.trim())
      .filter(Boolean);

    const treinamentosArray = editTreinamentos
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);

    try {
      const res = await apiFetch(`/api/cargos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: editNome.trim(),
          cbo: editCbo.trim(),
          riscos: riscosArray,
          treinamentos: treinamentosArray
        })
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar cargo.');
      }

      setSuccess(`Cargo '${editNome}' renomeado/atualizado com sucesso!`);
      cancelEdit();
      onCargoAdded();
    } catch (err: any) {
      setError(err.message || 'Erro ao editar cargo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCargo = async (cargo: Cargo) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cargo '${cargo.nome}'?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiFetch(`/api/cargos/${cargo.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Erro ao excluir cargo.');
      }

      setSuccess(`Cargo '${cargo.nome}' e seus vínculos foram removidos com sucesso.`);
      onCargoAdded();
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir cargo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" /> Tabela de Cargos e Matriz de Riscos SST
            </h2>
            <p className="text-slate-500 text-sm">
              Gerencie os cargos cadastrados, renomeie, edite ou exclua conforme a estrutura de sua empresa
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Cancelar' : 'Cadastrar Novo Cargo'}</span>
          </button>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form para adicionar novo Cargo */}
        {showAddForm && (
          <form onSubmit={handleAddCargo} className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base mb-2">Novo Cargo Ocupacional</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Nome do Cargo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Almoxarife"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Código CBO *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 4141-05"
                  value={cbo}
                  onChange={e => setCbo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-sm text-slate-900 font-mono focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Riscos Ocupacionais (1 por linha)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Ergonômico: Postura estática&#10;Acidentes: Queda de objetos"
                  value={riscosInput}
                  onChange={e => setRiscosInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Treinamentos e NRs (1 por linha)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: NR-01 Integração&#10;NR-11 Manuseio de Materiais"
                  value={treinamentosInput}
                  onChange={e => setTreinamentosInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
            >
              {loading ? 'Cadastrando...' : 'Salvar Cargo no Banco de Dados'}
            </button>
          </form>
        )}

        {/* Lista de Cargos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cargos.map(cargo => {
            const isEditing = editingCargoId === cargo.id;

            if (isEditing) {
              return (
                <div key={cargo.id} className="p-5 rounded-2xl border-2 border-blue-500 bg-blue-50/20 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Editando Cargo #{cargo.id}</span>
                    <button
                      onClick={cancelEdit}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nome do Cargo *</label>
                      <input
                        type="text"
                        value={editNome}
                        onChange={e => setEditNome(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-bold text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">CBO *</label>
                      <input
                        type="text"
                        value={editCbo}
                        onChange={e => setEditCbo(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-mono text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Riscos (1 por linha)</label>
                      <textarea
                        rows={3}
                        value={editRiscos}
                        onChange={e => setEditRiscos(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-sans text-slate-800 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Treinamentos (1 por linha)</label>
                      <textarea
                        rows={3}
                        value={editTreinamentos}
                        onChange={e => setEditTreinamentos(e.target.value)}
                        className="w-full px-3 py-2 bg-white rounded-lg border border-slate-300 font-sans text-slate-800 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleSaveEdit(cargo.id)}
                        disabled={loading}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={cargo.id} className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{cargo.nome}</h3>
                    <span className="text-xs text-slate-500 font-mono">ID no Banco: #{cargo.id}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs font-mono font-bold rounded-lg">
                      CBO {cargo.cbo}
                    </span>
                    <button
                      onClick={() => startEdit(cargo)}
                      title="Renomear / Editar Cargo"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCargo(cargo)}
                      title="Excluir Cargo"
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl space-y-1">
                    <div className="font-semibold text-amber-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Riscos Mapeados ({cargo.riscos.length})
                    </div>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5 pl-1">
                      {cargo.riscos.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1">
                    <div className="font-semibold text-blue-800 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Treinamentos Obrigatórios ({cargo.treinamentos.length})
                    </div>
                    <ul className="list-disc list-inside text-slate-700 space-y-0.5 pl-1">
                      {cargo.treinamentos.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

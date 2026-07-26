import React, { useState, useEffect } from 'react';
import { Building2, ArrowRight, ShieldCheck, KeyRound, Sparkles, FolderLock, Database, CheckCircle2, Users, FileCode2 } from 'lucide-react';
import { CompanySummary } from '../types';
import { fetchEmpresasSummary, setStoredEmpresaId } from '../lib/api';

interface Props {
  onCompanySelected: (empresaId: string) => void;
  currentEmpresaId?: string | null;
}

export const CompanyLoginView: React.FC<Props> = ({ onCompanySelected, currentEmpresaId }) => {
  const [empresaIdInput, setEmpresaIdInput] = useState(currentEmpresaId || '');
  const [empresasSummary, setEmpresasSummary] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEmpresas = async () => {
      setLoading(true);
      const list = await fetchEmpresasSummary();
      setEmpresasSummary(list);
      setLoading(false);
    };
    loadEmpresas();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = empresaIdInput.trim().toUpperCase();
    if (!cleanId) {
      setError('Por favor, digite o ID único da sua empresa (ex: EMP-1001 ou ACME-SST).');
      return;
    }
    setError(null);
    setStoredEmpresaId(cleanId);
    onCompanySelected(cleanId);
  };

  const handleSelectQuick = (id: string) => {
    const cleanId = id.trim().toUpperCase();
    setStoredEmpresaId(cleanId);
    onCompanySelected(cleanId);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8 max-w-4xl mx-auto">
      <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Banner Superior Decorativo */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 opacity-10 text-white pointer-events-none">
            <Building2 className="w-64 h-64" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ambiente Multitenant com Dados Isolados</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Identificação da Empresa
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Informe o ID único da sua empresa para acessar e gerenciar com total independência os cargos de SST, modelos de Word (.docx), histórico de colaboradores e backups automáticos.
            </p>
          </div>
        </div>

        {/* Formulário Principal de Entrada */}
        <div className="p-6 sm:p-10 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="empresa_id_input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                ID ou Código da Empresa
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5" />
                </div>

                <input
                  id="empresa_id_input"
                  type="text"
                  value={empresaIdInput}
                  onChange={(e) => setEmpresaIdInput(e.target.value.toUpperCase())}
                  placeholder="Ex: EMP-1001, ACME-SST, MATRIZ"
                  className="w-full pl-12 pr-36 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 transition-all outline-none uppercase tracking-wider"
                  autoFocus
                />

                <button
                  type="submit"
                  className="absolute inset-y-1.5 right-1.5 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <span>Acessar Dados</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {error && (
                <p className="text-xs text-rose-600 font-medium pl-1">{error}</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Dica: Se este ID ainda não existir no sistema, ele será iniciado automaticamente com o banco padrão de cargos de SST.</span>
            </div>
          </form>

          {/* Atalhos para Empresas Existentes / Ativas */}
          {empresasSummary.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Empresas Registradas no Servidor ({empresasSummary.length})</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {empresasSummary.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectQuick(emp.id)}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-500/50 rounded-2xl text-left transition-all group cursor-pointer flex items-center justify-between"
                  >
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {emp.logo_url ? (
                            <img src={emp.logo_url} alt={emp.nome || emp.id} className="w-8 h-8 rounded-lg object-contain bg-slate-900 p-0.5 border border-slate-700" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-black text-xs">
                              {emp.id.substring(0, 3)}
                            </div>
                          )}
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block">
                              {emp.nome || `Empresa ${emp.id}`}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">ID: {emp.id}</span>
                          </div>
                          {currentEmpresaId === emp.id && (
                            <span className="ml-2 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-full">
                              ATIVA
                            </span>
                          )}
                        </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" /> {emp.cargosCount} cargos
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <FileCode2 className="w-3 h-3 text-slate-400" /> {emp.templatesCount} tmpl
                        </span>
                        <span>•</span>
                        <span>{emp.colaboradoresCount} emissões</span>
                      </div>
                    </div>

                    <div className="p-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-200 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Três Pilares de Segurança & Privacidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                <FolderLock className="w-4 h-4" />
                <span>Dados Isolados</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Cada empresa possui sua base exclusiva de cargos e seus próprios arquivos de templates Word (.docx).
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Database className="w-4 h-4" />
                <span>Histórico Próprio</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Os colaboradores e Ordens de Serviço geradas por uma empresa não são visíveis para outros IDs.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Backups Individuais</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Todas as alterações geram arquivos JSON de backup salvos em tempo real com o código da empresa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

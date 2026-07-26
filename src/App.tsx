import { useState, useEffect } from 'react';
import { FileText, Database, Briefcase, FileCode2, History, ShieldCheck, Sparkles, Sun, Moon, HardDrive, Building2, KeyRound, LogOut, Settings } from 'lucide-react';
import { Cargo, CompanyInfo } from './types';
import { DocumentGeneratorForm } from './components/DocumentGeneratorForm';
import { SqlSchemaViewer } from './components/SqlSchemaViewer';
import { CargoManager } from './components/CargoManager';
import { TemplateManager } from './components/TemplateManager';
import { HistoryViewer } from './components/HistoryViewer';
import { SkeletonLoader } from './components/SkeletonLoader';
import { BackupManager } from './components/BackupManager';
import { CompanyLoginView } from './components/CompanyLoginView';
import { CompanyProfileModal } from './components/CompanyProfileModal';
import { apiFetch, fetchCompanyInfo, getStoredEmpresaId, setStoredEmpresaId } from './lib/api';

export default function App() {
  const [currentEmpresaId, setCurrentEmpresaId] = useState<string | null>(() => getStoredEmpresaId());
  const [activeTab, setActiveTab] = useState<'inicio' | 'gerador' | 'cargos' | 'templates' | 'historico' | 'backups' | 'sql'>(() => {
    return getStoredEmpresaId() ? 'gerador' : 'inicio';
  });

  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sst_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('sst_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const fetchCargos = () => {
    if (!currentEmpresaId) return;
    setLoadingCargos(true);
    apiFetch('/api/cargos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCargos(data);
        }
      })
      .catch(err => console.error('Erro ao buscar cargos:', err))
      .finally(() => setLoadingCargos(false));
  };

  const loadCompanyInfo = async () => {
    if (!currentEmpresaId) {
      setCompanyInfo(null);
      return;
    }
    const info = await fetchCompanyInfo();
    if (info) {
      setCompanyInfo(info);
    }
  };

  useEffect(() => {
    if (currentEmpresaId) {
      fetchCargos();
      loadCompanyInfo();
    } else {
      setCompanyInfo(null);
    }
  }, [currentEmpresaId]);

  const handleSelectCompany = (empresaId: string) => {
    setStoredEmpresaId(empresaId);
    setCurrentEmpresaId(empresaId);
    setActiveTab('gerador');
  };

  const handleSwitchCompany = () => {
    setActiveTab('inicio');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Banner & Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('inicio')}
                className="p-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl shadow-md flex items-center justify-center transition-all cursor-pointer overflow-hidden shrink-0"
                title="Ir para Página de Início / ID da Empresa"
              >
                {companyInfo?.logo_url ? (
                  <img
                    src={companyInfo.logo_url}
                    alt={companyInfo.nome}
                    className="w-10 h-10 object-contain rounded-xl bg-slate-950 p-0.5 border border-slate-800"
                  />
                ) : (
                  <div className="p-2 bg-blue-600 rounded-xl">
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    {companyInfo?.nome || 'SST DocAuto'}
                  </h1>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                    {currentEmpresaId ? `ID: ${currentEmpresaId}` : 'Multitenant SST'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  {companyInfo?.nome
                    ? `SST DocAuto • Ordens de Serviço (NR-01) - ${companyInfo.nome}`
                    : 'Automação de Ordens de Serviço (NR-01) com Isolamento Total por Empresa'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Badge da Empresa Ativa */}
              {currentEmpresaId ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-emerald-400 shadow-xs">
                  <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 font-normal hidden md:inline truncate max-w-[120px]">
                    {companyInfo?.nome || currentEmpresaId}:
                  </span>
                  <span className="font-mono tracking-wider">{currentEmpresaId}</span>
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="ml-1 text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-sans font-semibold"
                    title="Editar Perfil e Logomarca da Empresa"
                  >
                    <Settings className="w-3 h-3" />
                    <span className="hidden sm:inline">Logo/Nome</span>
                  </button>
                  <button
                    onClick={handleSwitchCompany}
                    className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-sans font-semibold"
                    title="Alternar / Trocar ID da empresa"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Trocar</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('inicio')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold cursor-pointer hover:bg-amber-500/30 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Informar ID da Empresa</span>
                </button>
              )}

              {/* Toggle de Tema Global */}
              <button
                onClick={toggleTheme}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
                title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-300" />
                    <span className="hidden sm:inline">Modo Escuro</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/80 border-t border-slate-800/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('inicio')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'inicio'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-950/40'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Página de Início (ID Empresa)</span>
              </button>

              <button
                onClick={() => {
                  if (!currentEmpresaId) {
                    setActiveTab('inicio');
                  } else {
                    setActiveTab('gerador');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'gerador'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>2 & 3. Gerar Documento</span>
              </button>

              <button
                onClick={() => {
                  if (!currentEmpresaId) {
                    setActiveTab('inicio');
                  } else {
                    setActiveTab('cargos');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'cargos'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Cargos e Riscos SST</span>
                {currentEmpresaId && (
                  <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-slate-300 text-[10px] rounded-full font-mono">
                    {cargos.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  if (!currentEmpresaId) {
                    setActiveTab('inicio');
                  } else {
                    setActiveTab('templates');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'templates'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileCode2 className="w-4 h-4" />
                <span>Templates .docx</span>
              </button>

              <button
                onClick={() => {
                  if (!currentEmpresaId) {
                    setActiveTab('inicio');
                  } else {
                    setActiveTab('historico');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'historico'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Histórico de Emissões</span>
              </button>

              <button
                onClick={() => {
                  if (!currentEmpresaId) {
                    setActiveTab('inicio');
                  } else {
                    setActiveTab('backups');
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'backups'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40'
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>Backups Automáticos</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              <button
                onClick={() => setActiveTab('sql')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'sql'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>1. Schema PostgreSQL (SQL)</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentEmpresaId || activeTab === 'inicio' ? (
          <CompanyLoginView
            currentEmpresaId={currentEmpresaId}
            onCompanySelected={handleSelectCompany}
          />
        ) : loadingCargos ? (
          <SkeletonLoader
            type={
              activeTab === 'gerador'
                ? 'form'
                : activeTab === 'cargos' || activeTab === 'templates'
                ? 'cards'
                : 'table'
            }
          />
        ) : (
          <>
            {activeTab === 'gerador' && (
              <div className="space-y-6">
                <DocumentGeneratorForm cargos={cargos} onDocumentGenerated={fetchCargos} />
              </div>
            )}

            {activeTab === 'cargos' && (
              <CargoManager cargos={cargos} onCargoAdded={fetchCargos} />
            )}

            {activeTab === 'templates' && (
              <TemplateManager cargos={cargos} />
            )}

            {activeTab === 'historico' && (
              <HistoryViewer />
            )}

            {activeTab === 'backups' && (
              <BackupManager />
            )}

            {activeTab === 'sql' && (
              <SqlSchemaViewer />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-12 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">SST DocAuto - Micro-SaaS de Automação de Documentos com Dados Isolados por Empresa</span>
          </div>
          <p>
            Desenvolvido com Express, docxtemplater, PizZip, React, TypeScript e Tailwind CSS
          </p>
        </div>
      </footer>
      {companyInfo && (
        <CompanyProfileModal
          companyInfo={companyInfo}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdated={(updated) => {
            setCompanyInfo(updated);
          }}
        />
      )}
    </div>
  );
}

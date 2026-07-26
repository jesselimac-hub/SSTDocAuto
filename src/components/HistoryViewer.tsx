import React, { useState, useEffect } from 'react';
import { History, UserCheck, RefreshCw, Calendar, Briefcase, Building2, CreditCard, FileSpreadsheet, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Colaborador } from '../types';
import { apiFetch } from '../lib/api';

export const HistoryViewer: React.FC = () => {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = () => {
    setLoading(true);
    apiFetch('/api/colaboradores')
      .then(res => res.json())
      .then(data => setColaboradores(data))
      .catch(err => console.error('Erro ao buscar histórico:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredColaboradores = colaboradores.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const cleanTerm = term.replace(/\D/g, ''); // Para busca por dígitos do CPF sem formatação
    const cleanCpf = c.cpf.replace(/\D/g, '');

    const matchName = c.nome.toLowerCase().includes(term);
    const matchCpf = c.cpf.toLowerCase().includes(term) || (cleanTerm.length > 0 && cleanCpf.includes(cleanTerm));
    const matchCargo = (c.cargo_nome || '').toLowerCase().includes(term);

    return matchName || matchCpf || matchCargo;
  });

  const handleExportExcel = () => {
    const listToExport = filteredColaboradores.length > 0 ? filteredColaboradores : colaboradores;
    if (listToExport.length === 0) return;

    const dataToExport = listToExport.map(c => ({
      'ID': c.id,
      'Nome do Colaborador': c.nome,
      'CPF': c.cpf,
      'Cargo': c.cargo_nome || 'N/A',
      'CBO': c.cbo || 'N/A',
      'Data de Admissão': c.data_admissao,
      'Data de Emissão': new Date(c.data_geracao).toLocaleString('pt-BR'),
      'Empresa / Razão Social': c.empresa || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Histórico de Emissões');

    // Define largura padrão para as colunas do Excel
    worksheet['!cols'] = [
      { wch: 8 },  // ID
      { wch: 32 }, // Nome do Colaborador
      { wch: 18 }, // CPF
      { wch: 28 }, // Cargo
      { wch: 12 }, // CBO
      { wch: 18 }, // Data de Admissao
      { wch: 22 }, // Data de Emissao
      { wch: 32 }  // Empresa / Razao Social
    ];

    const fileName = `Historico_Emissoes_SST_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Histórico de Documentos Gerados (Tabela colaboradores)</h2>
            <p className="text-slate-500 text-sm">
              Registros de todas as Ordens de Serviço e termos de integração emitidos via sistema
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleExportExcel}
            disabled={colaboradores.length === 0}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:cursor-not-allowed"
            title="Exportar tabela de histórico para arquivo .xlsx"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Registro</span>
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do colaborador, CPF ou cargo..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 transition-all outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              title="Limpar busca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {colaboradores.length > 0 && (
          <div className="text-xs text-slate-500 font-medium">
            Exibindo <span className="font-bold text-slate-800">{filteredColaboradores.length}</span> de <span className="font-bold text-slate-800">{colaboradores.length}</span> emissões
          </div>
        )}
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="p-3.5">ID</th>
              <th className="p-3.5">Colaborador</th>
              <th className="p-3.5">CPF</th>
              <th className="p-3.5">Cargo / CBO</th>
              <th className="p-3.5">Data Admissão</th>
              <th className="p-3.5">Data Emissão</th>
              <th className="p-3.5">Empresa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
            {colaboradores.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Nenhum documento emitido até o momento.
                </td>
              </tr>
            ) : filteredColaboradores.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500 space-y-2">
                  <p>Nenhum documento encontrado para a busca "{searchTerm}".</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Limpar filtro de pesquisa
                  </button>
                </td>
              </tr>
            ) : (
              filteredColaboradores.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 font-mono text-slate-400">#{c.id}</td>
                  <td className="p-3.5 font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{c.nome}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono">
                    <div className="flex items-center gap-1 text-slate-600">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      <span>{c.cpf}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-slate-400" />
                      <span>{c.cargo_nome || 'N/A'}</span>
                      {c.cbo && (
                        <span className="ml-1 px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-mono rounded text-slate-700">
                          {c.cbo}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{c.data_admissao}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-slate-600">
                    {new Date(c.data_geracao).toLocaleString('pt-BR')}
                  </td>
                  <td className="p-3.5 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{c.empresa || 'SST Corporativo'}</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

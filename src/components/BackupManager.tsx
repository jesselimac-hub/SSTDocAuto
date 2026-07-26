import React, { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, HardDrive, CheckCircle2, FileText, Clock, Save, ShieldCheck } from 'lucide-react';
import { BackupInfo } from '../types';
import { apiFetch } from '../lib/api';

export const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/backups');
      if (res.ok) {
        const data = await res.json();
        setBackups(data);
      }
    } catch (err) {
      console.error('Erro ao buscar backups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleManualBackup = async () => {
    setCreating(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/backups/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Backup manual acionado no painel de controle' })
      });
      if (res.ok) {
        setMessage('Novo backup instantâneo gerado e salvo com sucesso!');
        await fetchBackups();
      }
    } catch (err) {
      console.error('Erro ao acionar backup manual:', err);
    } finally {
      setCreating(false);
    }
  };

  const latestBackup = backups.length > 0 ? backups[0] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Backups Automáticos do Sistema</h2>
            <p className="text-slate-500 text-xs sm:text-sm">
              Persistência contínua: todas as inclusões, edições de cargos, uploads de templates e emissões de documentos geram um backup automático em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleManualBackup}
            disabled={creating}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Save className={`w-4 h-4 ${creating ? 'animate-bounce' : ''}`} />
            <span>{creating ? 'Salvando...' : 'Gerar Backup Agora'}</span>
          </button>

          <a
            href="/api/backups/download/latest_backup.json"
            download="latest_backup.json"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
            title="Download do backup mais recente em formato JSON"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Baixar Último Backup (.json)</span>
          </a>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Cartão de Status do Backup Automático */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <ShieldCheck className="w-4 h-4" />
            <span>Sistema de Autobackup Ativo</span>
          </div>
          {latestBackup && (
            <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Último salvamento: {new Date(latestBackup.timestamp).toLocaleString('pt-BR')}
            </span>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Cada alteração realizada no sistema gera uma cópia física em JSON contendo o estado consolidado dos <strong className="text-white">cargos</strong>, <strong className="text-white">templates de Word</strong> e <strong className="text-white">histórico de colaboradores</strong>.
        </p>

        {latestBackup && (
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60">
              <span className="block text-slate-400 text-[10px] uppercase font-bold">Cargos</span>
              <span className="text-base font-extrabold text-white">{latestBackup.counts.cargos}</span>
            </div>
            <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60">
              <span className="block text-slate-400 text-[10px] uppercase font-bold">Templates</span>
              <span className="text-base font-extrabold text-white">{latestBackup.counts.templates}</span>
            </div>
            <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/60">
              <span className="block text-slate-400 text-[10px] uppercase font-bold">Emissões</span>
              <span className="text-base font-extrabold text-white">{latestBackup.counts.colaboradores}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Histórico de Arquivos de Backup */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Histórico de Snapshots Automáticos ({backups.length})</span>
          </h3>

          <button
            onClick={fetchBackups}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3">Data e Hora</th>
                <th className="p-3">Gatilho / Evento Causador</th>
                <th className="p-3 text-center">Registros Salvos</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Nenhum backup registrado até o momento.
                  </td>
                </tr>
              ) : (
                backups.map((b, idx) => (
                  <tr key={b.filename} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">ÚLTIMO</span>
                        )}
                        <span>{new Date(b.timestamp).toLocaleString('pt-BR')}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {b.reason}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">
                      {b.counts.cargos} cargos • {b.counts.templates} tmpl • {b.counts.colaboradores} emissões
                    </td>
                    <td className="p-3 text-right">
                      <a
                        href={`/api/backups/download/${b.filename}`}
                        download={b.filename}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] rounded-lg transition-colors"
                        title="Baixar cópia deste backup em JSON"
                      >
                        <Download className="w-3 h-3 text-blue-600" />
                        <span>Baixar JSON</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

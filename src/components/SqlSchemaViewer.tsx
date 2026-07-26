import React, { useState, useEffect } from 'react';
import { Database, Copy, Check, Terminal, Server, Shield, Layers } from 'lucide-react';

export const SqlSchemaViewer: React.FC = () => {
  const [sqlContent, setSqlContent] = useState<string>('Carregando script SQL do PostgreSQL...');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/schema-sql')
      .then(res => res.text())
      .then(text => setSqlContent(text))
      .catch(err => setSqlContent(`-- Erro ao carregar schema: ${err.message}`));
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">1. Estrutura do Banco de Dados (PostgreSQL)</h2>
              <p className="text-slate-500 text-sm">
                DDL SQL oficial para criar as tabelas <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">cargos</code>, <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">templates</code> e <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">colaboradores</code>
              </p>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto shrink-0 shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado para a Área de Transferência!' : 'Copiar Script SQL'}</span>
          </button>
        </div>

        {/* Resumo das 3 Tabelas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <Layers className="w-4 h-4" /> 1. cargos
            </div>
            <p className="text-xs text-slate-600">
              Contém <code className="font-mono text-slate-800">id</code>, <code className="font-mono text-slate-800">nome</code>, <code className="font-mono text-slate-800">cbo</code>, <code className="font-mono text-slate-800">riscos</code> (JSONB) e <code className="font-mono text-slate-800">treinamentos</code> (JSONB).
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
              <Server className="w-4 h-4" /> 2. templates
            </div>
            <p className="text-xs text-slate-600">
              Contém <code className="font-mono text-slate-800">id</code>, <code className="font-mono text-slate-800">id_cargo</code> (FK), <code className="font-mono text-slate-800">caminho_arquivo_limpo</code> e <code className="font-mono text-slate-800">nome_template</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <Shield className="w-4 h-4" /> 3. colaboradores
            </div>
            <p className="text-xs text-slate-600">
              Contém <code className="font-mono text-slate-800">id</code>, <code className="font-mono text-slate-800">nome</code>, <code className="font-mono text-slate-800">cpf</code>, <code className="font-mono text-slate-800">data_admissao</code>, <code className="font-mono text-slate-800">id_cargo</code> (FK) e <code className="font-mono text-slate-800">data_geracao</code>.
            </p>
          </div>
        </div>

        {/* Container do Script SQL */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>src/db/schema.sql</span>
            </div>
            <span>PostgreSQL 14+ Dialect</span>
          </div>
          <pre className="p-5 text-xs font-mono text-slate-200 overflow-x-auto max-h-[500px] leading-relaxed select-all">
            {sqlContent}
          </pre>
        </div>
      </div>
    </div>
  );
};

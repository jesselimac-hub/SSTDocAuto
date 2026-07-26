import React, { useState, useEffect } from 'react';
import { FileCode2, Download, Upload, CheckCircle, AlertCircle, Info, Tag, FolderOpen, ShieldCheck, FileSearch, XCircle } from 'lucide-react';
import PizZip from 'pizzip';
import { Cargo, TemplateDoc } from '../types';
import { apiFetch } from '../lib/api';

interface Props {
  cargos: Cargo[];
}

interface ValidationResult {
  hasNome: boolean;
  hasCpf: boolean;
  hasData: boolean;
  detectedTags: string[];
  isValid: boolean;
}

export const TemplateManager: React.FC<Props> = ({ cargos }) => {
  const [templates, setTemplates] = useState<TemplateDoc[]>([]);
  const [selectedCargoId, setSelectedCargoId] = useState<number>(cargos.length > 0 ? cargos[0].id : 1);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const fetchTemplates = () => {
    apiFetch('/api/templates')
      .then(res => res.json())
      .then(data => setTemplates(data))
      .catch(err => console.error('Erro ao buscar templates:', err));
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const validateDocxFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) return;
        const zip = new PizZip(buffer);
        const xml = zip.file('word/document.xml')?.asText() || '';
        // Remove todas as tags XML para extrair o texto bruto do documento
        const rawText = xml.replace(/<[^>]+>/g, '');

        const hasNome = rawText.includes('{nome}');
        const hasCpf = rawText.includes('{cpf}');
        const hasData = rawText.includes('{data}') || rawText.includes('{data_admissao}') || rawText.includes('{data_geracao}');

        // Encontra todas as tags de substituicao no formato {variavel}
        const matches = rawText.match(/\{[a-zA-Z0-9_]+\}/g) || [];
        const uniqueTags = Array.from(new Set(matches));

        setValidationResult({
          hasNome,
          hasCpf,
          hasData,
          detectedTags: uniqueTags,
          isValid: hasNome && hasCpf && hasData
        });
      } catch (err) {
        console.error('Erro ao validar arquivo .docx:', err);
        setValidationResult(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (file: File | null) => {
    setFileToUpload(file);
    if (file) {
      validateDocxFile(file);
    } else {
      setValidationResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileToUpload) {
      setError('Por favor, selecione um arquivo .docx no seu computador.');
      return;
    }

    setUploading(true);
    setMessage(null);
    setError(null);

    const formData = new FormData();
    formData.append('id_cargo', String(selectedCargoId));
    formData.append('template_file', fileToUpload);

    try {
      const res = await apiFetch('/api/templates/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Erro ao fazer upload do template.');
      }

      setMessage(`Novo template .docx atualizado com sucesso no servidor!`);
      setFileToUpload(null);
      setValidationResult(null);
      fetchTemplates();
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Guia de Variáveis do Docxtemplater */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-xs border border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Variáveis Disponíveis para os Templates .docx</h3>
            <p className="text-slate-400 text-xs">
              Escreva estas tags dentro do seu documento Word original (.docx). A biblioteca <code className="text-blue-300 font-mono">docxtemplater</code> irá substituí-las automaticamente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-emerald-300 font-bold">
            {'{nome}'} <span className="block font-normal text-xs text-slate-300 font-sans mt-0.5">Nome do Colaborador</span>
          </div>
          <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-emerald-300 font-bold">
            {'{cpf}'} <span className="block font-normal text-xs text-slate-300 font-sans mt-0.5">CPF Formatado (000.000.000-00)</span>
          </div>
          <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-blue-300 font-bold">
            {'{data}'} <span className="block font-normal text-xs text-slate-300 font-sans mt-0.5">Data Admissional / Emissão (DD/MM/AAAA)</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-blue-600" /> Modelos e Arquivos Limpos no Servidor
            </h2>
            <p className="text-slate-500 text-sm">
              Cada cargo no banco vincula um arquivo .docx no diretório <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">/templates</code> do servidor.
            </p>
          </div>
        </div>

        {message && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Upload de Novo Template */}
        <form onSubmit={handleUpload} className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" /> Enviar Novo Template (.docx) Personalizado
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Vincular ao Cargo *
              </label>
              <select
                value={selectedCargoId}
                onChange={e => setSelectedCargoId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
              >
                {cargos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} (CBO: {c.cbo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Arquivo Word (.docx) *
              </label>
              <input
                type="file"
                accept=".docx"
                onChange={e => handleFileChange(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Painel do Validador de Template em Tempo Real */}
          {validationResult && (
            <div className={`p-4 rounded-xl border space-y-3 transition-all ${
              validationResult.isValid 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <FileSearch className="w-4 h-4 text-blue-600" />
                  <span>Validador de Template (.docx)</span>
                </div>
                {validationResult.isValid ? (
                  <span className="px-2 py-0.5 bg-emerald-200/80 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> VÁLIDO (Todas as tags encontradas)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-200/80 text-rose-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> ATENÇÃO (Tags pendentes)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className={`p-2.5 rounded-lg border flex items-center justify-between font-mono ${
                  validationResult.hasNome ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800' : 'bg-rose-100/70 border-rose-300 text-rose-800'
                }`}>
                  <span>{'{nome}'}</span>
                  {validationResult.hasNome ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                </div>

                <div className={`p-2.5 rounded-lg border flex items-center justify-between font-mono ${
                  validationResult.hasCpf ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800' : 'bg-rose-100/70 border-rose-300 text-rose-800'
                }`}>
                  <span>{'{cpf}'}</span>
                  {validationResult.hasCpf ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                </div>

                <div className={`p-2.5 rounded-lg border flex items-center justify-between font-mono ${
                  validationResult.hasData ? 'bg-emerald-100/70 border-emerald-300 text-emerald-800' : 'bg-rose-100/70 border-rose-300 text-rose-800'
                }`}>
                  <span>{'{data}'}</span>
                  {validationResult.hasData ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                </div>
              </div>

              {validationResult.detectedTags.length > 0 && (
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                  <span className="font-semibold text-slate-700">Todas as tags identificadas no Word: </span>
                  <span className="font-mono text-slate-800">{validationResult.detectedTags.join(', ')}</span>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !fileToUpload}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? 'Enviando...' : 'Substituir Template .docx no Servidor'}
          </button>
        </form>

        {/* Lista dos Templates em Disco */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-500" /> Templates Ativos Registrados
          </h3>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {templates.map(t => (
              <div key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{t.cargo_nome || `Cargo ID #${t.id_cargo}`}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                      {t.nome_template}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    Caminho: <code className="font-mono text-slate-700">{t.caminho_arquivo_limpo}</code>
                  </p>
                </div>

                <a
                  href={`/api/templates/download-default/${t.id_cargo}`}
                  download
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0 self-start sm:self-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Template Limpo</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

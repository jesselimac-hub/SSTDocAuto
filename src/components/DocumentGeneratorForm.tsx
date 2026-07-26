import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, AlertCircle, Building2, User, CreditCard, Calendar, Briefcase, ShieldAlert, BookOpen, Loader2 } from 'lucide-react';
import { Cargo, GerarDocumentoPayload } from '../types';
import { apiFetch } from '../lib/api';

interface Props {
  cargos: Cargo[];
  onDocumentGenerated?: () => void;
}

// Função utilitária para validação do formato e dígitos do CPF
export const validarCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais (ex: 000.000.000-00, 111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação do 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleanCPF.charAt(i), 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCPF.charAt(9), 10)) return false;

  // Validação do 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleanCPF.charAt(i), 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleanCPF.charAt(10), 10)) return false;

  return true;
};

export const DocumentGeneratorForm: React.FC<Props> = ({ cargos, onDocumentGenerated }) => {
  const [formData, setFormData] = useState<GerarDocumentoPayload>({
    nome: '',
    cpf: '',
    data_admissao: new Date().toISOString().split('T')[0],
    id_cargo: cargos.length > 0 ? cargos[0].id : 1,
    empresa: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Garante que se a lista de cargos carregar depois, o primeiro cargo fique selecionado
  useEffect(() => {
    if (cargos.length > 0 && (!formData.id_cargo || !cargos.some(c => c.id === formData.id_cargo))) {
      setFormData(prev => ({ ...prev, id_cargo: cargos[0].id }));
    }
  }, [cargos]);

  const selectedCargo = cargos.find(c => c.id === Number(formData.id_cargo));

  // Máscara simplificada de CPF (000.000.000-00)
  const formatCPF = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 11);
    return raw
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!formData.nome.trim()) {
      setErrorMessage('Por favor, informe o Nome Completo do colaborador.');
      setLoading(false);
      return;
    }

    if (!validarCPF(formData.cpf)) {
      setErrorMessage('Por favor, informe um CPF válido e com formato correto (000.000.000-00).');
      setLoading(false);
      return;
    }

    try {
      // Faz o POST para a rota do backend Express
      const response = await apiFetch('/gerar-documento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errJson;
        try {
          errJson = await response.json();
        } catch {
          errJson = { error: 'Falha na resposta do servidor' };
        }
        throw new Error(errJson.error || 'Erro ao gerar o documento de SST.');
      }

      // Obtém o Blob do arquivo .docx retornado
      const blob = await response.blob();

      // Tenta extrair o nome do arquivo a partir dos headers de resposta
      const disposition = response.headers.get('Content-Disposition');
      let filename = `Ordem_de_Servico_${formData.nome.replace(/\s+/g, '_')}.docx`;
      if (disposition && disposition.includes('filename=')) {
        const matches = disposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Dispara o download automático do arquivo no navegador
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage(`Documento .docx (${filename}) gerado e baixado com sucesso!`);
      if (onDocumentGenerated) {
        onDocumentGenerated();
      }
    } catch (err: any) {
      console.error('Erro na geração:', err);
      setErrorMessage(err.message || 'Erro ao se comunicar com o backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="bg-slate-900 text-white p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-500/30 text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Gerador de Ordem de Serviço & Integração (NR-01)</h2>
            <p className="text-slate-400 text-sm">
              Preencha os dados do colaborador para automatizar o preenchimento das variáveis no template .docx
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {successMessage && (
          <div id="success-banner" className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">{successMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div id="error-banner" className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Colaborador */}
            <div>
              <label htmlFor="colaborador_nome" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" /> Nome Completo do Colaborador *
              </label>
              <input
                id="colaborador_nome"
                type="text"
                required
                placeholder="Ex: João da Silva Santos"
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-900 text-sm"
              />
            </div>

            {/* CPF com máscara */}
            <div>
              <label htmlFor="colaborador_cpf" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" /> CPF *
              </label>
              <input
                id="colaborador_cpf"
                type="text"
                required
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleCpfChange}
                maxLength={14}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-900 text-sm font-mono"
              />
            </div>

            {/* Data de Admissão */}
            <div>
              <label htmlFor="colaborador_data_admissao" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Data de Admissão *
              </label>
              <input
                id="colaborador_data_admissao"
                type="date"
                required
                value={formData.data_admissao}
                onChange={e => setFormData({ ...formData, data_admissao: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-900 text-sm"
              />
            </div>

            {/* Seleção do Cargo (Dropdown) */}
            <div>
              <label htmlFor="colaborador_cargo" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" /> Selecione o Cargo / Função *
              </label>
              <select
                id="colaborador_cargo"
                value={formData.id_cargo}
                onChange={e => setFormData({ ...formData, id_cargo: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-900 text-sm font-medium bg-slate-50/50"
              >
                {cargos.map(cargo => (
                  <option key={cargo.id} value={cargo.id}>
                    {cargo.nome} (CBO: {cargo.cbo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nome da Empresa */}
          <div>
            <label htmlFor="colaborador_empresa" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" /> Empresa / Razão Social (Opcional)
            </label>
            <input
              id="colaborador_empresa"
              type="text"
              placeholder="Ex: Construtora e Empreendimentos Silva Ltda"
              value={formData.empresa}
              onChange={e => setFormData({ ...formData, empresa: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all text-slate-900 text-sm"
            />
          </div>

          {/* Pré-visualização dos Riscos e Treinamentos vinculados ao cargo selecionado */}
          {selectedCargo && (
            <div id="cargo-preview-card" className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mapeamento SST Ativo:</span>
                  <span className="font-semibold text-slate-900 text-sm">{selectedCargo.nome}</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
                  CBO: {selectedCargo.cbo}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Riscos */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5 text-amber-700">
                    <ShieldAlert className="w-4 h-4" /> Riscos Ocupacionais (NR-01)
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {selectedCargo.riscos.map((risco, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{risco}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Treinamentos */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5 text-blue-700">
                    <BookOpen className="w-4 h-4" /> Treinamentos e NRs Obrigatórias
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {selectedCargo.treinamentos.map((treinamento, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>{treinamento}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Botão Principal de Gerar Documento */}
          <div className="pt-2">
            <button
              id="btn-gerar-documento"
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-60 text-base cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processando e Preenchendo Template .docx...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Gerar Documentação de Integração (.docx)</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              O arquivo será gerado via Express + docxtemplater e baixado no formato .docx editável.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Upload, Building2, Check, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { CompanyInfo } from '../types';
import { updateCompanyInfo } from '../lib/api';

interface Props {
  companyInfo: CompanyInfo;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (newInfo: CompanyInfo) => void;
}

export const CompanyProfileModal: React.FC<Props> = ({
  companyInfo,
  isOpen,
  onClose,
  onUpdated
}) => {
  const [nome, setNome] = useState(companyInfo.nome || '');
  const [logoUrl, setLogoUrl] = useState(companyInfo.logo_url || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('A imagem deve ter menos de 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        setMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const updated = await updateCompanyInfo({
      nome: nome.trim() || `Empresa ${companyInfo.id}`,
      logo_url: logoUrl
    });

    setSaving(false);
    if (updated) {
      onUpdated(updated);
      onClose();
    } else {
      setMessage('Erro ao salvar os dados da empresa no servidor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header do Modal */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Perfil & Logomarca da Empresa</h2>
              <p className="text-xs text-slate-400 font-mono">ID: {companyInfo.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {message && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-400">
              {message}
            </div>
          )}

          {/* Nome da Empresa */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Nome de Exibição da Empresa
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: TCL Tecnologia & Construções"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              required
            />
          </div>

          {/* Logomarca da Empresa */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Logomarca Oficial
            </label>

            {/* Preview da Logo */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl">
              {logoUrl ? (
                <div className="w-20 h-20 rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
                  <img src={logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-700 border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center text-slate-400 shrink-0">
                  <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                  <span className="text-[9px]">Sem Logo</span>
                </div>
              )}

              <div className="flex-1 space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  A logo é exibida no topo da aplicação ao lado do nome da empresa.
                </p>

                <div className="flex items-center gap-2">
                  <label className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Selecionar Imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

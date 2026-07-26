export interface Cargo {
  id: number;
  nome: string;
  cbo: string;
  riscos: string[];
  treinamentos: string[];
  criado_em?: string;
}

export interface TemplateDoc {
  id: number;
  id_cargo: number;
  cargo_nome?: string;
  nome_template: string;
  caminho_arquivo_limpo: string;
  descricao?: string;
  atualizado_em?: string;
}

export interface Colaborador {
  id: number;
  nome: string;
  cpf: string;
  data_admissao: string;
  id_cargo: number;
  cargo_nome?: string;
  cbo?: string;
  data_geracao: string;
  empresa?: string;
}

export interface GerarDocumentoPayload {
  nome: string;
  cpf: string;
  data_admissao: string;
  id_cargo: number;
  empresa?: string;
}

export interface BackupInfo {
  filename: string;
  timestamp: string;
  reason: string;
  counts: {
    cargos: number;
    templates: number;
    colaboradores: number;
  };
  sizeBytes?: number;
}

export interface CompanyInfo {
  id: string;
  nome: string;
  logo_url?: string;
  cargosCount?: number;
  templatesCount?: number;
  colaboradoresCount?: number;
  criado_em?: string;
  atualizado_em?: string;
}

export interface CompanySummary {
  id: string;
  nome: string;
  logo_url?: string;
  cargosCount: number;
  templatesCount: number;
  colaboradoresCount: number;
  criado_em: string;
  atualizado_em: string;
}

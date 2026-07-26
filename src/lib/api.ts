import { CompanySummary, CompanyInfo } from '../types';

export function getStoredEmpresaId(): string | null {
  return localStorage.getItem('sst_empresa_id') || null;
}

export function setStoredEmpresaId(empresaId: string): void {
  const cleanId = empresaId.trim().toUpperCase();
  if (cleanId) {
    localStorage.setItem('sst_empresa_id', cleanId);
  }
}

export function clearStoredEmpresaId(): void {
  localStorage.removeItem('sst_empresa_id');
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const empresaId = getStoredEmpresaId() || 'EMP-1001';
  const headers = new Headers(init?.headers || {});

  if (!headers.has('x-empresa-id')) {
    headers.set('x-empresa-id', empresaId);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function parseJsonResponse<T = any>(res: Response): Promise<{ data: T | null; error: string | null }> {
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await res.json();
      if (!res.ok) {
        return { data: null, error: json.error || json.message || `Erro ${res.status}: Requisição falhou.` };
      }
      return { data: json, error: null };
    }
    const text = await res.text();
    if (!res.ok) {
      if (res.status === 413 || text.includes('Request Entity Too Large')) {
        return { data: null, error: 'O arquivo/dados enviados excedem o limite de tamanho permitido pelo servidor (413 Request Entity Too Large). Tente um arquivo menor.' };
      }
      return { data: null, error: text.slice(0, 200) || `Erro ${res.status}: Falha no servidor.` };
    }
    try {
      const jsonParsed = JSON.parse(text);
      return { data: jsonParsed, error: null };
    } catch {
      return { data: null, error: text.slice(0, 200) };
    }
  } catch (err: any) {
    return { data: null, error: err.message || 'Erro ao processar resposta do servidor.' };
  }
}

export async function fetchCompanyInfo(): Promise<CompanyInfo | null> {
  try {
    const res = await apiFetch('/api/empresa/info');
    const { data } = await parseJsonResponse<CompanyInfo>(res);
    return data;
  } catch (err) {
    console.error('Erro ao buscar dados da empresa:', err);
  }
  return null;
}

export async function updateCompanyInfo(data: { nome?: string; logo_url?: string }): Promise<CompanyInfo | null> {
  try {
    const res = await apiFetch('/api/empresa/info', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const { data: updated } = await parseJsonResponse<CompanyInfo>(res);
    return updated;
  } catch (err) {
    console.error('Erro ao atualizar dados da empresa:', err);
  }
  return null;
}

export async function restoreBackup(backupData: any): Promise<boolean> {
  try {
    const res = await apiFetch('/api/backups/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData),
    });
    return res.ok;
  } catch (err) {
    console.error('Erro ao restaurar backup:', err);
    return false;
  }
}

export async function fetchEmpresasSummary(): Promise<CompanySummary[]> {
  try {
    const res = await apiFetch('/api/empresas');
    const { data } = await parseJsonResponse<CompanySummary[]>(res);
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar lista de empresas:', err);
  }
  return [];
}

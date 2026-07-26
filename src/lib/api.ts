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

export async function fetchCompanyInfo(): Promise<CompanyInfo | null> {
  try {
    const res = await apiFetch('/api/empresa/info');
    if (res.ok) {
      return await res.json();
    }
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
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Erro ao atualizar dados da empresa:', err);
  }
  return null;
}

export async function fetchEmpresasSummary(): Promise<CompanySummary[]> {
  try {
    const res = await apiFetch('/api/empresas');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('Erro ao buscar lista de empresas:', err);
  }
  return [];
}

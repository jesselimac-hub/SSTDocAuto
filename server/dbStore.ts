import fs from 'fs';
import path from 'path';
import { Cargo, TemplateDoc, Colaborador } from '../src/types.js';
import { createDefaultDocxTemplateBuffer } from './docxEngine.js';

const TEMPLATES_DIR = path.join(process.cwd(), 'templates');
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

interface CompanyStore {
  id: string;
  nome: string;
  logo_url: string;
  cargos: Cargo[];
  templates: TemplateDoc[];
  colaboradores: Colaborador[];
  criado_em: string;
  atualizado_em: string;
}

const companyStores: Record<string, CompanyStore> = {};

function createDefaultCargos(): Cargo[] {
  return [
    {
      id: 1,
      nome: 'Pedreiro',
      cbo: '7152-10',
      riscos: [
        'Físico: Ruído contínuo e Vibração de ferramentas',
        'Químico: Poeiras minerais (cimentos, cal e poeira de corte)',
        'Ergonômico: Levantamento manual de peso e postura inclinada',
        'Acidentes: Queda de altura, projeção de partículas e perfuração'
      ],
      treinamentos: [
        'NR-01 - Integração Geral de Segurança e Saúde no Trabalho',
        'NR-06 - Equipamentos de Proteção Individual (EPI)',
        'NR-18 - Condições e Meio Ambiente de Trabalho na Indústria da Construção',
        'NR-35 - Trabalho em Altura (Capacitação e Reciclagem)'
      ],
      criado_em: new Date().toISOString()
    },
    {
      id: 2,
      nome: 'Eletricista de Manutenção',
      cbo: '7156-15',
      riscos: [
        'Físico: Ruído de máquinas em operação',
        'Ergonômico: Postura ortostática prolongada e braços elevados',
        'Acidentes: Choque elétrico, arco elétrico, queimaduras térmicas e queda de escadas'
      ],
      treinamentos: [
        'NR-01 - Integração Geral de SST',
        'NR-06 - Uso, Guarda e Higienização de EPIs Específicos',
        'NR-10 - Segurança em Instalações e Serviços em Eletricidade (Básico e SEP)',
        'NR-35 - Trabalho em Altura'
      ],
      criado_em: new Date().toISOString()
    },
    {
      id: 3,
      nome: 'Servente de Obras',
      cbo: '7170-20',
      riscos: [
        'Físico: Ruído do canteiro de obras',
        'Químico: Poeira de varrição e argamassa',
        'Ergonômico: Carregamento manual de materiais',
        'Acidentes: Prensamento de membros, queda de objetos e tropeços'
      ],
      treinamentos: [
        'NR-01 - Treinamento de Integração Admissional de SST',
        'NR-06 - Equipamentos de Proteção Individual',
        'NR-18 - Segurança na Construção Civil'
      ],
      criado_em: new Date().toISOString()
    },
    {
      id: 4,
      nome: 'Operador de Empilhadeira',
      cbo: '7822-20',
      riscos: [
        'Físico: Ruído de motor e ambiente industrial',
        'Ergonômico: Vibração de corpo inteiro e movimentos repetitivos de tronco',
        'Acidentes: Tombamento de equipamento, atropelamento e colisão'
      ],
      treinamentos: [
        'NR-01 - Integração de Segurança no Trabalho',
        'NR-06 - Uso Obrigatório de EPIs',
        'NR-11 - Transporte, Movimentação, Armazenamento e Manuseio de Materiais'
      ],
      criado_em: new Date().toISOString()
    },
    {
      id: 5,
      nome: 'Soldador',
      cbo: '7242-05',
      riscos: [
        'Físico: Radiação não ionizante (Ultra-Violeta e Infra-Vermelho) e Calor',
        'Químico: Fumos metálicos de soldagem (Manganês, Ferro, Cromo)',
        'Acidentes: Queimaduras por respingos, projeção de escória e risco de incêndio'
      ],
      treinamentos: [
        'NR-01 - Integração Geral de SST',
        'NR-06 - EPIs de Proteção Facial, Respiratória e Térmica',
        'NR-18 / NR-34 - Segurança em Trabalhos a Quente'
      ],
      criado_em: new Date().toISOString()
    }
  ];
}

function ensureTemplateDiskFile(empresaId: string, template: TemplateDoc, cargoName?: string): string {
  const fullPath = path.isAbsolute(template.caminho_arquivo_limpo)
    ? template.caminho_arquivo_limpo
    : path.join(process.cwd(), template.caminho_arquivo_limpo);

  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(fullPath)) {
    const title = cargoName || template.cargo_nome || 'SST';
    const defaultBuffer = createDefaultDocxTemplateBuffer(`ORDEM DE SERVIÇO DE SST - ${title.toUpperCase()} (${empresaId})`);
    fs.writeFileSync(fullPath, defaultBuffer);
  }

  return fullPath;
}

function createDefaultTemplates(empresaId: string, cargos: Cargo[]): TemplateDoc[] {
  return cargos.map(cargo => {
    const filename = `ordem_servico_${empresaId.toLowerCase()}_${cargo.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}.docx`;
    const relativePath = path.join('templates', filename);

    const tmpl: TemplateDoc = {
      id: cargo.id,
      id_cargo: cargo.id,
      cargo_nome: cargo.nome,
      nome_template: filename,
      caminho_arquivo_limpo: relativePath,
      descricao: `Template gerado automaticamente para ${cargo.nome} (${empresaId})`,
      atualizado_em: new Date().toISOString()
    };

    ensureTemplateDiskFile(empresaId, tmpl, cargo.nome);

    return tmpl;
  });
}

function getCompanyStore(empresaIdRaw?: string): CompanyStore {
  const id = (empresaIdRaw || 'EMP-1001').toString().trim().toUpperCase() || 'EMP-1001';

  if (!companyStores[id]) {
    const cargos = createDefaultCargos();
    const templates = createDefaultTemplates(id, cargos);

    let companyName = `Empresa ${id}`;
    let logoUrl = '';

    if (id === 'TCL-1001') {
      companyName = 'TCL Tecnologia & Construções';
      try {
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'tcl_logo_1785089896277.jpg');
        if (fs.existsSync(logoPath)) {
          const imgBuf = fs.readFileSync(logoPath);
          logoUrl = `data:image/jpeg;base64,${imgBuf.toString('base64')}`;
        }
      } catch (e) {
        console.error('Erro ao carregar logo TCL-1001:', e);
      }
    }

    const colaboradores: Colaborador[] = [
      {
        id: 1,
        nome: 'Carlos Eduardo Silva',
        cpf: '123.456.789-00',
        data_admissao: '2025-01-10',
        id_cargo: 1,
        cargo_nome: 'Pedreiro',
        cbo: '7152-10',
        data_geracao: new Date(Date.now() - 86400000 * 5).toISOString(),
        empresa: companyName
      },
      {
        id: 2,
        nome: 'Mariana Santos Oliveira',
        cpf: '987.654.321-11',
        data_admissao: '2024-11-01',
        id_cargo: 2,
        cargo_nome: 'Eletricista de Manutenção',
        cbo: '7156-15',
        data_geracao: new Date(Date.now() - 86400000 * 2).toISOString(),
        empresa: companyName
      }
    ];

    companyStores[id] = {
      id,
      nome: companyName,
      logo_url: logoUrl,
      cargos,
      templates,
      colaboradores,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    };

    performAutoBackup(id, `Inicialização da Empresa ID #${id}`);
  }

  return companyStores[id];
}

function performAutoBackup(empresaId: string, reason: string) {
  try {
    const store = companyStores[empresaId];
    if (!store) return;

    const timestamp = new Date().toISOString();
    const formattedDate = timestamp.replace(/[:.]/g, '-');
    const filename = `backup_${empresaId.toLowerCase()}_${formattedDate}.json`;
    const fullPath = path.join(BACKUPS_DIR, filename);
    const latestPath = path.join(BACKUPS_DIR, `latest_backup_${empresaId.toLowerCase()}.json`);

    const backupContent = {
      empresaId,
      timestamp,
      reason,
      counts: {
        cargos: store.cargos.length,
        templates: store.templates.length,
        colaboradores: store.colaboradores.length
      },
      data: {
        cargos: store.cargos,
        templates: store.templates,
        colaboradores: store.colaboradores
      }
    };

    const jsonStr = JSON.stringify(backupContent, null, 2);

    fs.writeFileSync(fullPath, jsonStr, 'utf-8');
    fs.writeFileSync(latestPath, jsonStr, 'utf-8');

    // Mantém no máximo 20 backups por empresa
    const existingFiles = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.startsWith(`backup_${empresaId.toLowerCase()}_`) && f.endsWith('.json'))
      .sort()
      .reverse();

    if (existingFiles.length > 20) {
      existingFiles.slice(20).forEach(oldFile => {
        try {
          fs.unlinkSync(path.join(BACKUPS_DIR, oldFile));
        } catch (_) {}
      });
    }
  } catch (err) {
    console.error(`Falha ao gerar backup automático para ${empresaId}:`, err);
  }
}

export const dbStore = {
  getEmpresasSummary() {
    // Retorna a lista de empresas ativas registradas em memória
    return Object.values(companyStores).map(store => ({
      id: store.id,
      nome: store.nome,
      logo_url: store.logo_url,
      cargosCount: store.cargos.length,
      templatesCount: store.templates.length,
      colaboradoresCount: store.colaboradores.length,
      criado_em: store.criado_em,
      atualizado_em: store.atualizado_em
    }));
  },

  getCompanyInfo(empresaId?: string) {
    const store = getCompanyStore(empresaId);
    return {
      id: store.id,
      nome: store.nome,
      logo_url: store.logo_url
    };
  },

  updateCompanyInfo(empresaId: string | undefined, data: { nome?: string; logo_url?: string }) {
    const store = getCompanyStore(empresaId);
    if (data.nome !== undefined && data.nome.trim()) {
      store.nome = data.nome.trim();
    }
    if (data.logo_url !== undefined) {
      store.logo_url = data.logo_url;
    }
    store.atualizado_em = new Date().toISOString();
    performAutoBackup(store.id, `Atualização de dados da empresa (${store.nome})`);
    return {
      id: store.id,
      nome: store.nome,
      logo_url: store.logo_url
    };
  },

  getCargos(empresaId?: string): Cargo[] {
    const store = getCompanyStore(empresaId);
    return store.cargos;
  },

  getCargoById(empresaId: string | undefined, id: number): Cargo | undefined {
    const store = getCompanyStore(empresaId);
    return store.cargos.find((c) => c.id === Number(id));
  },

  addCargo(empresaId: string | undefined, cargo: Omit<Cargo, 'id' | 'criado_em'>): Cargo {
    const store = getCompanyStore(empresaId);
    const newId = store.cargos.length > 0 ? Math.max(...store.cargos.map((c) => c.id)) + 1 : 1;
    const newCargo: Cargo = {
      ...cargo,
      id: newId,
      criado_em: new Date().toISOString()
    };
    store.cargos.push(newCargo);

    const filename = `ordem_servico_${store.id.toLowerCase()}_${newCargo.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}.docx`;
    const relativePath = path.join('templates', filename);
    const fullPath = path.join(process.cwd(), relativePath);

    const defaultBuffer = createDefaultDocxTemplateBuffer(`ORDEM DE SERVIÇO DE SST - ${newCargo.nome.toUpperCase()} (${store.id})`);
    fs.writeFileSync(fullPath, defaultBuffer);

    store.templates.push({
      id: newId,
      id_cargo: newId,
      cargo_nome: newCargo.nome,
      nome_template: filename,
      caminho_arquivo_limpo: relativePath,
      descricao: `Template gerado automaticamente para ${newCargo.nome} (${store.id})`,
      atualizado_em: new Date().toISOString()
    });

    store.atualizado_em = new Date().toISOString();
    performAutoBackup(store.id, `Inclusão de novo cargo: ${newCargo.nome}`);

    return newCargo;
  },

  updateCargo(empresaId: string | undefined, id: number, updatedFields: Partial<Omit<Cargo, 'id'>>): Cargo | null {
    const store = getCompanyStore(empresaId);
    const index = store.cargos.findIndex((c) => c.id === Number(id));
    if (index === -1) return null;

    store.cargos[index] = {
      ...store.cargos[index],
      ...updatedFields
    };

    if (updatedFields.nome) {
      const tmpl = store.templates.find((t) => t.id_cargo === Number(id));
      if (tmpl) {
        tmpl.cargo_nome = updatedFields.nome;
      }
    }

    store.atualizado_em = new Date().toISOString();
    performAutoBackup(store.id, `Atualização do cargo ID #${id}: ${store.cargos[index].nome}`);

    return store.cargos[index];
  },

  deleteCargo(empresaId: string | undefined, id: number): boolean {
    const store = getCompanyStore(empresaId);
    const cargoIndex = store.cargos.findIndex((c) => c.id === Number(id));
    if (cargoIndex === -1) return false;

    const removedCargo = store.cargos[cargoIndex];

    store.cargos.splice(cargoIndex, 1);

    const tmplIndex = store.templates.findIndex((t) => t.id_cargo === Number(id));
    if (tmplIndex !== -1) {
      store.templates.splice(tmplIndex, 1);
    }

    store.atualizado_em = new Date().toISOString();
    performAutoBackup(store.id, `Exclusão do cargo ID #${id}: ${removedCargo.nome}`);

    return true;
  },

  getTemplates(empresaId?: string): TemplateDoc[] {
    const store = getCompanyStore(empresaId);
    store.templates.forEach(tmpl => {
      ensureTemplateDiskFile(store.id, tmpl);
    });
    return store.templates;
  },

  getTemplateByCargoId(empresaId: string | undefined, idCargo: number): TemplateDoc | undefined {
    const store = getCompanyStore(empresaId);
    const tmpl = store.templates.find((t) => t.id_cargo === Number(idCargo));
    if (tmpl) {
      ensureTemplateDiskFile(store.id, tmpl);
    }
    return tmpl;
  },

  updateTemplateFile(empresaId: string | undefined, idCargo: number, filename: string, relativePath: string): TemplateDoc {
    const store = getCompanyStore(empresaId);
    let t = store.templates.find((tmpl) => tmpl.id_cargo === Number(idCargo));
    const cargo = store.cargos.find((c) => c.id === Number(idCargo));

    if (!t) {
      t = {
        id: store.templates.length + 1,
        id_cargo: Number(idCargo),
        cargo_nome: cargo ? cargo.nome : 'Cargo Desconhecido',
        nome_template: filename,
        caminho_arquivo_limpo: relativePath,
        descricao: `Template personalizado enviado para empresa ${store.id}`,
        atualizado_em: new Date().toISOString()
      };
      store.templates.push(t);
    } else {
      t.nome_template = filename;
      t.caminho_arquivo_limpo = relativePath;
      t.atualizado_em = new Date().toISOString();
    }

    store.atualizado_em = new Date().toISOString();
    performAutoBackup(store.id, `Upload de novo template para o cargo: ${t.cargo_nome}`);

    return t;
  },

  getColaboradores(empresaId?: string): Colaborador[] {
    const store = getCompanyStore(empresaId);
    return store.colaboradores;
  },

  addColaborador(empresaId: string | undefined, colab: Omit<Colaborador, 'id' | 'data_geracao'>): Colaborador {
    const store = getCompanyStore(empresaId);
    const cargo = this.getCargoById(store.id, colab.id_cargo);
    const newColab: Colaborador = {
      ...colab,
      id: store.colaboradores.length + 1,
      cargo_nome: cargo ? cargo.nome : 'N/A',
      cbo: cargo ? cargo.cbo : 'N/A',
      data_geracao: new Date().toISOString(),
      empresa: colab.empresa || `Empresa ${store.id}`
    };
    store.colaboradores.unshift(newColab);

    store.atualizado_em = new Date().toISOString();
    performAutoBackup(store.id, `Emissão de documento SST para colaborador: ${newColab.nome}`);

    return newColab;
  },

  getBackupsList(empresaId?: string) {
    const store = getCompanyStore(empresaId);
    try {
      if (!fs.existsSync(BACKUPS_DIR)) return [];
      const prefix = `backup_${store.id.toLowerCase()}_`;
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.startsWith(prefix) && f.endsWith('.json'))
        .sort()
        .reverse();

      return files.map(file => {
        const fullPath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(fullPath);
        let reason = 'Backup Automático';
        let timestamp = stats.mtime.toISOString();
        let counts = { cargos: store.cargos.length, templates: store.templates.length, colaboradores: store.colaboradores.length };

        try {
          const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          if (content.reason) reason = content.reason;
          if (content.timestamp) timestamp = content.timestamp;
          if (content.counts) counts = content.counts;
        } catch (_) {}

        return {
          filename: file,
          timestamp,
          reason,
          counts,
          sizeBytes: stats.size
        };
      });
    } catch (err) {
      console.error(`Erro ao listar backups para ${store.id}:`, err);
      return [];
    }
  },

  getBackupFile(empresaId: string | undefined, filename: string) {
    const store = getCompanyStore(empresaId);
    const safeFilename = path.basename(filename);
    const fullPath = path.join(BACKUPS_DIR, safeFilename);

    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, 'utf-8');
    }
    return null;
  },

  triggerManualBackup(empresaId: string | undefined, reason?: string) {
    const store = getCompanyStore(empresaId);
    performAutoBackup(store.id, reason || 'Backup manual solicitado pelo usuário');
    return this.getBackupsList(store.id)[0];
  },

  getTemplatesDir(): string {
    return TEMPLATES_DIR;
  }
};

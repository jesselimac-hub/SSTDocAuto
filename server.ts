import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { dbStore } from './server/dbStore.js';
import { generateDocxFromTemplate, createDefaultDocxTemplateBuffer } from './server/docxEngine.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Helper para extrair o ID da empresa do cabeçalho x-empresa-id, query param ou body
  function getEmpresaId(req: express.Request): string {
    const headerId = req.headers['x-empresa-id'];
    if (headerId && typeof headerId === 'string' && headerId.trim()) {
      return headerId.trim().toUpperCase();
    }
    const queryId = req.query.empresa_id;
    if (queryId && typeof queryId === 'string' && queryId.trim()) {
      return queryId.trim().toUpperCase();
    }
    const bodyId = req.body?.empresa_id;
    if (bodyId && typeof bodyId === 'string' && bodyId.trim()) {
      return bodyId.trim().toUpperCase();
    }
    return 'EMP-1001';
  }

  // Configuração do Multer para upload de templates (.docx)
  const uploadDir = dbStore.getTemplatesDir();
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const empresaId = getEmpresaId(req);
      const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
      cb(null, `${Date.now()}_${empresaId}_${safeName}`);
    }
  });
  const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
      if (file.originalname.endsWith('.docx') || file.mimetype.includes('wordprocessingml')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos .docx são permitidos para templates de SST.'));
      }
    }
  });

  // =========================================================================
  // ROTAS DA API
  // =========================================================================

  // Rota de Health Check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'SST DocAuto API', timestamp: new Date().toISOString() });
  });

  // Rota para listar empresas cadastradas no servidor
  app.get('/api/empresas', (_req, res) => {
    res.json(dbStore.getEmpresasSummary());
  });

  // Obter informações da Empresa Ativa (Nome e Logo)
  app.get('/api/empresa/info', (req, res) => {
    const empresaId = getEmpresaId(req);
    res.json(dbStore.getCompanyInfo(empresaId));
  });

  // Atualizar informações da Empresa Ativa (Nome e Logo)
  app.put('/api/empresa/info', (req, res) => {
    try {
      const empresaId = getEmpresaId(req);
      const { nome, logo_url } = req.body;
      const updated = dbStore.updateCompanyInfo(empresaId, { nome, logo_url });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao atualizar dados da empresa', details: err.message });
    }
  });

  // Rota para obter o script SQL do PostgreSQL
  app.get('/api/schema-sql', (_req, res) => {
    try {
      const sqlFilePath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
      if (fs.existsSync(sqlFilePath)) {
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
        return res.setHeader('Content-Type', 'text/plain; charset=utf-8').send(sqlContent);
      }
      res.status(404).send('-- Arquivo schema.sql não encontrado.');
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao ler schema.sql', details: err.message });
    }
  });

  // Listar Cargos registrados para a empresa ativa
  app.get('/api/cargos', (req, res) => {
    const empresaId = getEmpresaId(req);
    res.json(dbStore.getCargos(empresaId));
  });

  // Cadastrar Novo Cargo para a empresa ativa
  app.post('/api/cargos', (req, res) => {
    try {
      const empresaId = getEmpresaId(req);
      const { nome, cbo, riscos, treinamentos } = req.body;
      if (!nome || !cbo) {
        return res.status(400).json({ error: 'Os campos Nome e CBO são obrigatórios.' });
      }
      const newCargo = dbStore.addCargo(empresaId, {
        nome,
        cbo,
        riscos: Array.isArray(riscos) ? riscos : (riscos ? [riscos] : []),
        treinamentos: Array.isArray(treinamentos) ? treinamentos : (treinamentos ? [treinamentos] : [])
      });
      res.status(201).json(newCargo);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao cadastrar cargo', details: err.message });
    }
  });

  // Atualizar / Renomear Cargo
  app.put('/api/cargos/:id', (req, res) => {
    try {
      const empresaId = getEmpresaId(req);
      const id = Number(req.params.id);
      const { nome, cbo, riscos, treinamentos } = req.body;
      
      const updated = dbStore.updateCargo(empresaId, id, {
        ...(nome && { nome }),
        ...(cbo && { cbo }),
        ...(riscos && { riscos: Array.isArray(riscos) ? riscos : [riscos] }),
        ...(treinamentos && { treinamentos: Array.isArray(treinamentos) ? treinamentos : [treinamentos] })
      });

      if (!updated) {
        return res.status(404).json({ error: 'Cargo não encontrado para esta empresa.' });
      }

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao atualizar cargo', details: err.message });
    }
  });

  // Excluir Cargo
  app.delete('/api/cargos/:id', (req, res) => {
    try {
      const empresaId = getEmpresaId(req);
      const id = Number(req.params.id);
      const success = dbStore.deleteCargo(empresaId, id);

      if (!success) {
        return res.status(404).json({ error: 'Cargo não encontrado.' });
      }

      res.json({ message: 'Cargo excluído com sucesso.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao excluir cargo', details: err.message });
    }
  });

  // Listar Templates da empresa
  app.get('/api/templates', (req, res) => {
    const empresaId = getEmpresaId(req);
    res.json(dbStore.getTemplates(empresaId));
  });

  // Upload de Template .docx personalizado para um cargo da empresa
  app.post('/api/templates/upload', upload.single('template_file'), (req, res) => {
    try {
      const empresaId = getEmpresaId(req);
      const idCargo = Number(req.body.id_cargo);
      if (!idCargo || !req.file) {
        return res.status(400).json({ error: 'É necessário selecionar um cargo e enviar um arquivo .docx' });
      }

      const relativePath = path.relative(process.cwd(), req.file.path);
      const updatedTemplate = dbStore.updateTemplateFile(empresaId, idCargo, req.file.originalname, relativePath);

      res.json({ message: 'Template .docx atualizado com sucesso!', template: updatedTemplate });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro no upload do template', details: err.message });
    }
  });

  // Download do Template .docx original limpo
  app.get('/api/templates/download-default/:idCargo', (req, res) => {
    try {
      const empresaId = getEmpresaId(req);
      const idCargo = Number(req.params.idCargo);
      const template = dbStore.getTemplateByCargoId(empresaId, idCargo);
      if (!template) {
        return res.status(404).json({ error: 'Template não encontrado para este cargo nesta empresa.' });
      }

      const fullPath = path.isAbsolute(template.caminho_arquivo_limpo)
        ? template.caminho_arquivo_limpo
        : path.join(process.cwd(), template.caminho_arquivo_limpo);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'Arquivo do template não existe no disco do servidor.' });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${template.nome_template}"`);
      fs.createReadStream(fullPath).pipe(res);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao baixar template', details: err.message });
    }
  });

  // Listar Histórico de Colaboradores / Documentos Gerados por Empresa
  app.get('/api/colaboradores', (req, res) => {
    const empresaId = getEmpresaId(req);
    res.json(dbStore.getColaboradores(empresaId));
  });

  // =========================================================================
  // ROTAS DE BACKUP AUTOMÁTICO POR EMPRESA
  // =========================================================================

  // Listar todos os backups automáticos salvos da empresa
  app.get('/api/backups', (req, res) => {
    try {
      const empresaId = getEmpresaId(req);
      const backups = dbStore.getBackupsList(empresaId);
      res.json(backups);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao listar backups automáticos', details: err.message });
    }
  });

  // Forçar acionamento de um backup manual/imediato da empresa
  app.post('/api/backups/trigger', (req, res) => {
    try {
      const empresaId = getEmpresaId(req);
      const reason = req.body?.reason || 'Backup manual solicitado no painel';
      const newBackup = dbStore.triggerManualBackup(empresaId, reason);
      res.json({ message: 'Backup gerado com sucesso!', backup: newBackup });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao gerar backup manual', details: err.message });
    }
  });

  // Restaurar / Importar backup JSON para a empresa ativa
  app.post('/api/backups/restore', (req, res) => {
    try {
      const empresaId = getEmpresaId(req);
      const backupData = req.body;
      if (!backupData || (typeof backupData !== 'object')) {
        return res.status(400).json({ error: 'Conteúdo do backup JSON é inválido.' });
      }
      const restored = dbStore.restoreBackup(empresaId, backupData);
      res.json({ message: 'Backup restaurado com sucesso no servidor!', company: restored });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao restaurar backup', details: err.message });
    }
  });

  // Download do arquivo de backup específico ou do mais recente da empresa
  app.get('/api/backups/download/:filename?', (req, res) => {
    try {
      const empresaId = getEmpresaId(req);
      const filename = req.params.filename || `latest_backup_${empresaId.toLowerCase()}.json`;
      const content = dbStore.getBackupFile(empresaId, filename);

      if (!content) {
        return res.status(404).json({ error: 'Arquivo de backup não encontrado.' });
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao baixar arquivo de backup', details: err.message });
    }
  });

  // =========================================================================
  // ROTA PRINCIPAL REQUISITADA: /gerar-documento (E /api/gerar-documento)
  // =========================================================================
  const handleGerarDocumento = async (req: express.Request, res: express.Response) => {
    try {
      const empresaId = getEmpresaId(req);
      const { nome, cpf, data_admissao, id_cargo, empresa } = req.body;

      if (!nome || !cpf || !data_admissao || !id_cargo) {
        return res.status(400).json({
          error: 'Parâmetros ausentes. Forneça: nome, cpf, data_admissao e id_cargo.'
        });
      }

      const cargoIdNum = Number(id_cargo);

      // Consulta cargo e template específicos da empresa
      const cargo = dbStore.getCargoById(empresaId, cargoIdNum);
      if (!cargo) {
        return res.status(404).json({ error: `Cargo de ID ${id_cargo} não encontrado para a empresa ${empresaId}.` });
      }

      const templateInfo = dbStore.getTemplateByCargoId(empresaId, cargoIdNum);
      if (!templateInfo) {
        return res.status(404).json({ error: `Nenhum template .docx cadastrado para o cargo '${cargo.nome}'.` });
      }

      const templatePath = path.isAbsolute(templateInfo.caminho_arquivo_limpo)
        ? templateInfo.caminho_arquivo_limpo
        : path.join(process.cwd(), templateInfo.caminho_arquivo_limpo);

      if (!fs.existsSync(templatePath)) {
        const dir = path.dirname(templatePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const defaultBuf = createDefaultDocxTemplateBuffer(`ORDEM DE SERVIÇO DE SST - ${cargo.nome.toUpperCase()} (${empresaId})`);
        fs.writeFileSync(templatePath, defaultBuf);
      }

      const templateBuffer = fs.readFileSync(templatePath);

      const dataGeracaoFormatted = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const dataAdmissaoFormatted = new Date(data_admissao + 'T00:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      const riscosTexto = Array.isArray(cargo.riscos) ? cargo.riscos.join('; ') : String(cargo.riscos);
      const treinamentosTexto = Array.isArray(cargo.treinamentos) ? cargo.treinamentos.join('; ') : String(cargo.treinamentos);

      const nomeEmpresaExibicao = empresa || `Empresa ${empresaId}`;

      const docxOutputBuffer = generateDocxFromTemplate(templateBuffer, {
        nome: String(nome).trim(),
        cpf: String(cpf).trim(),
        cbo: String(cargo.cbo),
        cargo_nome: String(cargo.nome),
        riscos: riscosTexto,
        treinamentos: treinamentosTexto,
        data_admissao: dataAdmissaoFormatted,
        data_geracao: dataGeracaoFormatted,
        empresa: nomeEmpresaExibicao
      });

      dbStore.addColaborador(empresaId, {
        nome,
        cpf,
        data_admissao,
        id_cargo: cargoIdNum,
        empresa: nomeEmpresaExibicao
      });

      const filenameClean = `Ordem_de_Servico_${nome.replace(/\s+/g, '_')}_${cargo.nome.replace(/\s+/g, '_')}.docx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filenameClean}"`);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

      return res.send(docxOutputBuffer);
    } catch (err: any) {
      console.error('Erro ao processar template .docx:', err);
      return res.status(500).json({
        error: 'Erro interno ao preencher o documento com docxtemplater',
        details: err.message
      });
    }
  };

  app.post('/gerar-documento', handleGerarDocumento);
  app.post('/api/gerar-documento', handleGerarDocumento);

  // =========================================================================
  // VITE MIDDLEWARE (DEV vs PROD)
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SST DocAuto Backend] Servidor rodando na porta ${PORT}`);
    console.log(`[Templates] Diretório de templates pronto em: ${uploadDir}`);
  });
}

startServer();

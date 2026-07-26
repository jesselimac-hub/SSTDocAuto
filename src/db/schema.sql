-- =============================================================================
-- ESTRUTURA DO BANCO DE DADOS POSTGRESQL (SST MICRO-SAAS)
-- Sistema de Automação de Ordens de Serviço e Termos de Integração em SST
-- =============================================================================

-- 1. TABELA DE CARGOS
-- Armazena os cargos, código CBO, matriz de riscos ocupacionais e treinamentos NRs
CREATE TABLE IF NOT EXISTS cargos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cbo VARCHAR(20) NOT NULL,
    riscos JSONB DEFAULT '[]'::jsonb, -- Ex: ["Físico: Ruído contínuo", "Químico: Poeira sílica", "Ergonômico: Postura inadequada"]
    treinamentos JSONB DEFAULT '[]'::jsonb, -- Ex: ["NR-01 Integração Geral", "NR-06 Uso e Conservação de EPI", "NR-35 Trabalho em Altura"]
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE TEMPLATES
-- Mapeia os modelos de documentos (.docx) vinculados a cada cargo
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    id_cargo INT NOT NULL REFERENCES cargos(id) ON DELETE CASCADE,
    nome_template VARCHAR(255) NOT NULL,
    caminho_arquivo_limpo VARCHAR(500) NOT NULL, -- Caminho físico ou URL do template .docx original no servidor
    descricao TEXT,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE COLABORADORES
-- Registro de cada emissão de Ordem de Serviço / Ficha de Integração
CREATE TABLE IF NOT EXISTS colaboradores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL,
    data_admissao DATE NOT NULL,
    id_cargo INT NOT NULL REFERENCES cargos(id) ON DELETE RESTRICT,
    data_geracao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES PARA OTIMIZAÇÃO DE BUSCA
CREATE INDEX IF NOT EXISTS idx_cargos_cbo ON cargos(cbo);
CREATE INDEX IF NOT EXISTS idx_colaboradores_cpf ON colaboradores(cpf);
CREATE INDEX IF NOT EXISTS idx_templates_id_cargo ON templates(id_cargo);

-- =============================================================================
-- DADOS INICIAIS DE TESTE (SEED DATA FOR SST)
-- =============================================================================

INSERT INTO cargos (nome, cbo, riscos, treinamentos) VALUES
(
    'Pedreiro',
    '7152-10',
    '["Físico: Ruído e Vibração", "Químico: Poeiras minerais (cimento e cal)", "Ergonômico: Levantamento de peso", "Acidente: Queda de nível, corte e impacto"]'::jsonb,
    '["NR-01 Integração Geral de Segurança", "NR-06 Uso Correto e Higienização de EPI", "NR-18 Segurança na Construção Civil", "NR-35 Trabalho em Altura"]'::jsonb
),
(
    'Eletricista de Manutenção',
    '7156-15',
    '["Físico: Ruído de máquinas", "Ergonômico: Postura em pé prolongada", "Acidente: Choque elétrico, arco elétrico e queimaduras"]'::jsonb,
    '["NR-01 Integração Geral", "NR-06 Equipamentos de Proteção Individual", "NR-10 Segurança em Instalações Elétricas", "NR-35 Trabalho em Altura"]'::jsonb
),
(
    'Servente de Obras',
    '7170-20',
    '["Físico: Ruído", "Químico: Poeira de varrição", "Ergonômico: Carga manual", "Acidente: Queda de objetos e prensamento"]'::jsonb,
    '["NR-01 Integração Geral de SST", "NR-06 Conservação de EPI", "NR-18 Treinamento Admissional"]'::jsonb
),
(
    'Operador de Empilhadeira',
    '7822-20',
    '["Físico: Ruído do motor", "Ergonômico: Vibração de corpo inteiro", "Acidente: Tombamento, colisão e atropelamento"]'::jsonb,
    '["NR-01 Integração Geral", "NR-06 Uso de EPI", "NR-11 Transporte e Manuseio de Materiais"]'::jsonb
),
(
    'Soldador',
    '7242-05',
    '["Físico: Radiação não ionizante (UV/IV)", "Químico: Fumos metálicos e óxidos", "Acidente: Queimadura por respingos e incêndio"]'::jsonb,
    '["NR-01 Integração Geral", "NR-06 EPI Específico", "NR-18/NR-34 Trabalho a Quente"]'::jsonb
);

-- INSERIR TEMPLATES PADRÃO CORRESPONDENTES
INSERT INTO templates (id_cargo, nome_template, caminho_arquivo_limpo, descricao) VALUES
(1, 'OS_Pedreiro_Template.docx', 'templates/ordem_servico_pedreiro.docx', 'Ordem de Serviço NR-01 para Pedreiro'),
(2, 'OS_Eletricista_Template.docx', 'templates/ordem_servico_eletricista.docx', 'Ordem de Serviço NR-01 + NR-10 para Eletricista'),
(3, 'OS_Servente_Template.docx', 'templates/ordem_servico_servente.docx', 'Ordem de Serviço NR-01 para Servente de Obras'),
(4, 'OS_Operador_Empilhadeira_Template.docx', 'templates/ordem_servico_empilhadeira.docx', 'Ordem de Serviço NR-01 + NR-11 para Operador'),
(5, 'OS_Soldador_Template.docx', 'templates/ordem_servico_soldador.docx', 'Ordem de Serviço NR-01 + Trabalho a Quente para Soldador');

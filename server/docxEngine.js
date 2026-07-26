import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

/**
 * Cria um arquivo .docx mínimo e válido estruturalmente com as tags do Docxtemplater,
 * para garantir que o servidor já inicie com templates prontos para uso imediato.
 */
export function createDefaultDocxTemplateBuffer(title = 'ORDEM DE SERVIÇO - SST') {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1D4ED8"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="1D4ED8"/></w:rPr><w:t>${title}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    
    <w:p>
      <w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>DADOS DO COLABORADOR E INTEGRAÇÃO DE SST</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Nome do Colaborador: </w:t></w:r>
      <w:r><w:t>{nome}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>CPF: </w:t></w:r>
      <w:r><w:t>{cpf}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Data: </w:t></w:r>
      <w:r><w:t>{data}</w:t></w:r>
    </w:p>

    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="24"/></w:rPr><w:t>TERMO DE INTEGRAÇÃO</w:t></w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Declaro para os devidos fins que o(a) colaborador(a) {nome}, portador(a) do CPF {cpf}, realizou o treinamento de integração de Segurança e Saúde no Trabalho na data de {data}.</w:t>
      </w:r>
    </w:p>

    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>____________________________________________________</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/><w:rPr><w:b/></w:rPr></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>{nome} (CPF: {cpf})</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t>Assinatura do Colaborador - Data: {data}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`;

  const zip = new PizZip();
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/_rels/document.xml.rels', docRelsXml);
  zip.file('word/document.xml', documentXml);

  return zip.generate({ type: 'nodebuffer' });
}

/**
 * Função principal de preenchimento do template .docx usando docxtemplater e pizzip
 */
export function generateDocxFromTemplate(templateBuffer, data) {
  const renderContext = {
    nome: data.nome || '',
    cpf: data.cpf || '',
    cbo: data.cbo || '',
    cargo_nome: data.cargo_nome || data.cargo || '',
    cargo: data.cargo || data.cargo_nome || '',
    riscos: data.riscos || '',
    treinamentos: data.treinamentos || '',
    data_admissao: data.data_admissao || '',
    data_geracao: data.data_geracao || '',
    data: data.data || data.data_admissao || data.data_geracao || '',
    empresa: data.empresa || '',
    dados: data.dados || `Nome: ${data.nome || ''} | CPF: ${data.cpf || ''} | Data: ${data.data || data.data_admissao || ''}`,
    // Suporte para loops {#riscos_list} e {#treinamentos_list} caso existam no template
    riscos_list: Array.isArray(data.riscos_raw) ? data.riscos_raw.map(r => ({ item: r })) : [],
    treinamentos_list: Array.isArray(data.treinamentos_raw) ? data.treinamentos_raw.map(t => ({ item: t })) : []
  };

  try {
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter(part) {
        if (part && part.value) {
          return renderContext[part.value] !== undefined ? renderContext[part.value] : '';
        }
        return '';
      }
    });

    doc.render(renderContext);

    return doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });
  } catch (err) {
    console.error('Erro no docxtemplater:', err);
    if (err.properties && err.properties.errors) {
      console.error('Erros detalhados do docxtemplater:', JSON.stringify(err.properties.errors, null, 2));
    }

    // Estratégia de Fallback 1: Substituição direta em XML via PizZip
    try {
      const zipFallback = new PizZip(templateBuffer);
      let docXml = zipFallback.file('word/document.xml')?.asText();
      if (docXml) {
        const replacements = {
          '{nome}': renderContext.nome,
          '{cpf}': renderContext.cpf,
          '{cbo}': renderContext.cbo,
          '{cargo_nome}': renderContext.cargo_nome,
          '{cargo}': renderContext.cargo,
          '{data}': renderContext.data,
          '{data_admissao}': renderContext.data_admissao,
          '{data_geracao}': renderContext.data_geracao,
          '{empresa}': renderContext.empresa,
          '{riscos}': renderContext.riscos,
          '{treinamentos}': renderContext.treinamentos,
          '{dados}': renderContext.dados,
        };

        for (const [key, val] of Object.entries(replacements)) {
          docXml = docXml.split(key).join(val);
        }

        zipFallback.file('word/document.xml', docXml);
        return zipFallback.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      }
    } catch (fallbackErr) {
      console.error('Erro no fallback XML:', fallbackErr);
    }

    // Estratégia de Fallback 2: Gera com o template limpo padrão do sistema
    const defaultBuffer = createDefaultDocxTemplateBuffer(`ORDEM DE SERVIÇO DE SST - ${(renderContext.cargo_nome || 'SST').toUpperCase()}`);
    const zipDefault = new PizZip(defaultBuffer);
    const docDefault = new Docxtemplater(zipDefault, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => ''
    });
    docDefault.render(renderContext);
    return docDefault.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  }
}

import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

/**
 * Cria um arquivo .docx mínimo e válido estruturalmente com as tags do Docxtemplater,
 * para garantir que o servidor já inicie com templates prontos para uso imediato.
 */
export function createDefaultDocxTemplateBuffer(title: string = 'ORDEM DE SERVIÇO - SST'): Buffer {
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
export function generateDocxFromTemplate(
  templateBuffer: Buffer,
  data: {
    nome: string;
    cpf: string;
    cbo: string;
    cargo_nome: string;
    riscos: string;
    treinamentos: string;
    data_admissao: string;
    data_geracao: string;
    empresa?: string;
  }
): Buffer {
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // Renderiza e substitui estritamente as variáveis {nome}, {cpf} e {data}
  doc.render({
    nome: data.nome,
    cpf: data.cpf,
    data: data.data_admissao || data.data_geracao,
  });

  return doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
}

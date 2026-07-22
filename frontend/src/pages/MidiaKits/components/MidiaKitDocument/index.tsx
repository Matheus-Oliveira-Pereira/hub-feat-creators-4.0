import { Document, pdf } from '@react-pdf/renderer';
import { MidiaKitTemplate, Sessao } from '../../service';
import { Capa } from './Capa';
import { Sobre } from './Sobre';
import { Conteudos } from './Conteudos';
import { Insights } from './Insights';
import { Marcas } from './Marcas';
import { Galeria } from './Galeria';
import { Contato } from './Contato';

function renderSessao(template: MidiaKitTemplate, sessao: Sessao, key: string) {
  switch (sessao.tipo) {
    case 'CAPA': return <Capa key={key} template={template} sessao={sessao} />;
    case 'SOBRE_INFLUENCIADOR': return <Sobre key={key} sessao={sessao} />;
    case 'CONTEUDOS':
    case 'EXEMPLOS_PUBLIS': return <Conteudos key={key} sessao={sessao} />;
    case 'INSIGHTS_INSTAGRAM':
    case 'INSIGHTS_TIKTOK':
    case 'INSIGHTS_YOUTUBE':
    case 'INSIGHTS_LINKEDIN':
    case 'INSIGHTS_LINKEDIN_NEWSLETTER': return <Insights key={key} sessao={sessao} />;
    case 'MARCAS': return <Marcas key={key} sessao={sessao} />;
    case 'CONTATO': return <Contato key={key} template={template} sessao={sessao} />;
    default: return <Galeria key={key} sessao={sessao} />;
  }
}

export function MidiaKitDocument({ template }: Readonly<{ template: MidiaKitTemplate }>) {
  const sessoes = [...(template.sessoes ?? [])]
    .filter((s) => s.ativa !== false)
    .sort((a, b) => a.ordem - b.ordem);
  return (
    <Document title={`Mídia Kit — ${template.nome}`}>
      {sessoes.map((s, i) => renderSessao(template, s, s.id ?? `s-${i}`))}
    </Document>
  );
}

/** Gera o PDF do template e dispara o download no navegador. */
export async function baixarPdf(template: MidiaKitTemplate): Promise<void> {
  const blob = await pdf(<MidiaKitDocument template={template} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `midia-kit-${(template.nome || 'template').replace(/\s+/g, '-').toLowerCase()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export default MidiaKitDocument;

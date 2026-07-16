import { useState, type ReactNode } from 'react';
import { formatarValor, rotularPt } from '../../service';

/** Reduz um array de objetos [{nome, valor}] a pares "nome → valor" para preview. */
function paresDeArray(arr: unknown[]): [string, unknown][] | null {
  const pares: [string, unknown][] = [];
  for (const it of arr) {
    if (!it || typeof it !== 'object' || Array.isArray(it)) return null;
    const o = it as Record<string, unknown>;
    const chaves = Object.keys(o);
    if (!chaves.length) return null;
    const nomeKey = chaves.find((k) => /nome|cidade|label|rotulo|regi|local|pais|estado/i.test(k)) ?? chaves[0];
    const valKey = chaves.find((k) => k !== nomeKey && (typeof o[k] === 'number' || /percent|valor|value|pct|taxa|qtd|total/i.test(k)))
      ?? chaves.find((k) => k !== nomeKey);
    if (valKey == null) return null;
    pares.push([rotularPt(String(o[nomeKey])), o[valKey]]);
  }
  return pares.length ? pares : null;
}

function Par({ chave, valor }: { chave: string; valor: unknown }) {
  return (
    <div className="analytics-item">
      <span className="analytics-key">{chave}</span>
      <span className="analytics-val">{formatarValor(valor)}</span>
    </div>
  );
}

/** Grupo (objeto/lista de objetos) recolhível — começa fechado. */
function Colapsavel({ titulo, children, qtd }: { titulo: string; children: ReactNode; qtd: number }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="analytics-bloco">
      <button type="button" className="analytics-bloco-tit" onClick={() => setAberto((a) => !a)}>
        <i className={aberto ? 'pi pi-chevron-down' : 'pi pi-chevron-right'} />
        <span>{titulo}</span>
        <span className="analytics-bloco-qtd">{qtd}</span>
      </button>
      {aberto && <div className="analytics-bloco-corpo">{children}</div>}
    </div>
  );
}

/** Renderiza recursivamente escalares/listas/objetos dos analytics de forma legível. */
function AnalyticsNode({ dados }: { dados: Record<string, unknown> }) {
  return (
    <div className="analytics-grupo">
      {Object.entries(dados).map(([k, v]) => {
        if (Array.isArray(v)) {
          const pares = paresDeArray(v);
          if (pares) {
            return (
              <Colapsavel key={k} titulo={rotularPt(k)} qtd={pares.length}>
                {pares.map(([nome, val]) => <Par key={nome} chave={nome} valor={val} />)}
              </Colapsavel>
            );
          }
          return <Par key={k} chave={rotularPt(k)} valor={v.map((x) => formatarValor(x)).join(', ')} />;
        }
        if (v && typeof v === 'object') {
          const sub = v as Record<string, unknown>;
          return (
            <Colapsavel key={k} titulo={rotularPt(k)} qtd={Object.keys(sub).length}>
              <AnalyticsNode dados={sub} />
            </Colapsavel>
          );
        }
        return <Par key={k} chave={rotularPt(k)} valor={v} />;
      })}
    </div>
  );
}

function AnalyticsView({ json }: { json?: string | null }) {
  if (!json) return null;
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return <div className="analytics-raw">{json}</div>;
  }
  return <AnalyticsNode dados={obj} />;
}

export default AnalyticsView;

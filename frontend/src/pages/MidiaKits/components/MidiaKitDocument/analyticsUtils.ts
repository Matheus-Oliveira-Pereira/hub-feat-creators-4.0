import { formatarValor, rotularPt } from '../../service';

export function ehUrl(s?: string | null): boolean {
  return !!s && (/^https?:\/\//.test(s) || s.startsWith('data:image'));
}

/** Aplica máscara de telefone BR; mantém valor cru se não reconhecer o formato. */
export function formatarTelefone(v: string): string {
  const d = (v ?? '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  return v;
}

export function parseAnalytics(json?: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    const o = JSON.parse(json);
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

export function rotular(k: string): string {
  return rotularPt(k);
}

export function larguraBarra(v: unknown): string {
  const m = /([\d.,]+)\s*%/.exec(String(v));
  if (!m) return '0%';
  const n = Number.parseFloat(m[1].replace(',', '.'));
  return `${Math.max(0, Math.min(100, n))}%`;
}

export function valorPct(v: unknown): number {
  const m = /([\d.,]+)\s*%/.exec(String(v));
  return m ? Number.parseFloat(m[1].replace(',', '.')) : -1;
}

/** Converte valor (número ou string) num número; null se não numérico. */
export function valorNum(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = /-?[\d.,]+/.exec(String(v));
  if (!m) return null;
  const t = m[0].includes(',') ? m[0].replace(/\./g, '').replace(',', '.') : m[0];
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

export function escalaresDe(obj: Record<string, unknown>): [string, unknown][] {
  return Object.entries(obj).filter(([, v]) => v !== null && typeof v !== 'object' && !Array.isArray(v));
}

/** Converte um array de objetos [{nome, percentual}] num Record { nome: valor } (nomes acentuados). */
export function arrayObjParaRecord(arr: unknown[]): Record<string, unknown> | null {
  const rec: Record<string, unknown> = {};
  for (const it of arr) {
    if (!it || typeof it !== 'object' || Array.isArray(it)) return null;
    const o = it as Record<string, unknown>;
    const chaves = Object.keys(o);
    if (!chaves.length) return null;
    const nomeKey = chaves.find((k) => /nome|cidade|label|rotulo|regi|local|pais|estado/i.test(k)) ?? chaves[0];
    const valKey = chaves.find((k) => k !== nomeKey && (typeof o[k] === 'number' || /percent|valor|value|pct|taxa|qtd|total/i.test(k)))
      ?? chaves.find((k) => k !== nomeKey);
    if (valKey == null) return null;
    rec[String(o[nomeKey])] = o[valKey];
  }
  return Object.keys(rec).length ? rec : null;
}

/** True se os escalares do grupo são percentuais: têm '%', somam ~100 (gênero 76/23/1),
 *  ou são taxas no intervalo 0–100 com decimais (cidades 11.2/2.6/...). */
export function ehPctGrupo(obj: Record<string, unknown>): boolean {
  const escal = escalaresDe(obj);
  if (escal.some(([, v]) => String(v).includes('%'))) return true;
  const nums = escal.map(([, v]) => valorNum(v)).filter((n): n is number => n != null);
  if (nums.length < 2 || !nums.every((n) => n >= 0 && n <= 100)) return false;
  const soma = nums.reduce((a, b) => a + b, 0);
  if (Math.abs(soma - 100) <= 6) return true;
  const comDecimais = nums.filter((n) => Math.abs(n - Math.round(n)) > 1e-9).length;
  return comDecimais * 2 >= nums.length;
}

/** Rótulo de chave com traço em faixas numéricas (13_17 → 13-17, 65_mais → 65+). */
export function rotularChave(k: string): string {
  if (/^\d+_\d+$/.test(k)) return k.replace('_', '-');
  if (/^\d+_mais$/i.test(k)) return k.replace(/_mais$/i, '+');
  return rotular(k);
}

/** Texto + largura de barra de um escalar, considerando se o grupo é percentual. */
export function pctInfo(v: unknown, pctGrupo: boolean): { display: string; largura: string | null } {
  const jaPct = String(v).includes('%');
  const num = valorNum(v);
  if (jaPct) return { display: String(v).trim().replace('.', ','), largura: `${Math.max(0, Math.min(100, valorPct(v)))}%` };
  if (pctGrupo && num != null) return { display: `${String(num).replace('.', ',')}%`, largura: `${Math.max(0, Math.min(100, num))}%` };
  return { display: formatarValor(v), largura: null };
}

/** Gera frases-resumo do público a partir dos painéis demográficos (gênero/faixa/cidade). */
export function resumoPublico(objetos: [string, Record<string, unknown>][]): string[] {
  const frases: string[] = [];
  for (const [nome, obj] of objetos) {
    if (!ehPctGrupo(obj)) continue;
    const escal = escalaresDe(obj).filter(([, v]) => valorNum(v) != null);
    if (!escal.length) continue;
    const [chave, valor] = escal.reduce((a, b) => ((valorNum(b[1]) ?? -1) > (valorNum(a[1]) ?? -1) ? b : a));
    const pct = pctInfo(valor, true).display;
    const n = nome.toLowerCase();
    if (/g[êe]n|sexo/.test(n)) {
      const genero = /home|masc/i.test(chave) ? 'masculino' : 'feminino';
      // qualificador distingue painéis múltiplos (Gênero Espectadores / Gênero Seguidores).
      const qualif = nome.replace(/g[êe]nero?/i, '').replace(/[_-]/g, ' ').trim();
      frases.push(qualif
        ? `${rotular(qualif)} majoritariamente ${genero} (${pct}).`
        : `Público majoritariamente ${genero} (${pct}).`);
    } else if (/cidad|local|regi/.test(n)) {
      frases.push(`Principal cidade é ${rotularChave(chave)} (${pct}).`);
    } else if (/faixa|et[áa]r|^idade|\bidade\b/.test(n)) {
      frases.push(`Faixa etária dominante de ${rotularChave(chave)} anos (${pct}).`);
    } else {
      frases.push(`${rotular(nome)}: ${rotularChave(chave)} (${pct}).`);
    }
  }
  return frases;
}

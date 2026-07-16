import { describe, it, expect } from 'vitest';
import {
  rotularPt, formatarValor, parseConfig, parseFotos, sessaoVazia, garantirUrl, Sessao,
} from '../../pages/MidiaKits/service';

describe('rotularPt', () => {
  it('acentua métricas conhecidas vindas de snake_case', () => {
    expect(rotularPt('visualizacoes')).toBe('Visualizações');
    expect(rotularPt('interacoes')).toBe('Interações');
    expect(rotularPt('faixa_etaria')).toBe('Faixa Etária');
    expect(rotularPt('genero')).toBe('Gênero');
  });

  it('acentua nomes de cidades', () => {
    expect(rotularPt('sao_paulo')).toBe('São Paulo');
    expect(rotularPt('belo_horizonte')).toBe('Belo Horizonte');
    expect(rotularPt('brasilia')).toBe('Brasília');
    expect(rotularPt('rio_de_janeiro')).toBe('Rio de Janeiro');
  });

  it('mantém conectores em minúsculo (exceto no início)', () => {
    expect(rotularPt('tempo_de_exibicao')).toBe('Tempo de Exibição');
  });

  it('capitaliza palavras desconhecidas sem alterá-las', () => {
    expect(rotularPt('ctr')).toBe('Ctr');
    expect(rotularPt('foo_bar')).toBe('Foo Bar');
  });
});

describe('formatarValor', () => {
  it('formata milhares e milhões em pt-BR', () => {
    expect(formatarValor(842000)).toBe('842 Mil');
    expect(formatarValor(1838725)).toBe('1,8 Milhão');
    expect(formatarValor(2632699)).toBe('2,6 Milhões');
  });

  it('expande sufixos abreviados (K/M) antes de formatar', () => {
    expect(formatarValor('842K')).toBe('842 Mil');
    expect(formatarValor('1.8M')).toBe('1,8 Milhão');
  });

  it('preserva percentuais e strings', () => {
    expect(formatarValor('12,9%')).toBe('12,9%');
    expect(formatarValor('engajamento alto')).toBe('engajamento alto');
  });

  it('mantém números pequenos como estão', () => {
    expect(formatarValor(163)).toBe('163');
  });
});

describe('parseConfig / parseFotos', () => {
  it('retorna objeto vazio para JSON inválido', () => {
    expect(parseConfig('{quebrado')).toEqual({});
    expect(parseConfig(null)).toEqual({});
  });

  it('parseia config válido', () => {
    expect(parseConfig('{"comando":"x"}')).toEqual({ comando: 'x' });
  });

  it('retorna lista vazia para fotos inválidas', () => {
    expect(parseFotos('nao-e-json')).toEqual([]);
    expect(parseFotos(null)).toEqual([]);
  });
});

describe('sessaoVazia', () => {
  const base: Sessao = { tipo: 'CONTEUDOS', ordem: 0 };

  it('CAPA e CONTATO nunca são vazias', () => {
    expect(sessaoVazia({ ...base, tipo: 'CAPA' })).toBe(false);
    expect(sessaoVazia({ ...base, tipo: 'CONTATO' })).toBe(false);
  });

  it('foto conta como conteúdo', () => {
    expect(sessaoVazia({ ...base, fotos: '["data:image/jpeg;base64,x"]' })).toBe(false);
  });

  it('texto e analytics contam como conteúdo', () => {
    expect(sessaoVazia({ ...base, conteudo: 'oi' })).toBe(false);
    expect(sessaoVazia({ ...base, analyticsJson: '{"a":1}' })).toBe(false);
  });

  it('sem nada é vazia', () => {
    expect(sessaoVazia({ ...base, fotos: '[]', conteudo: '  ' })).toBe(true);
  });
});

describe('garantirUrl', () => {
  it('prefixa https:// quando falta', () => {
    expect(garantirUrl('drive.google.com/x')).toBe('https://drive.google.com/x');
    expect(garantirUrl('https://a.b')).toBe('https://a.b');
    expect(garantirUrl('')).toBe('');
  });
});

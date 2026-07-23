import { describe, it, expect } from 'vitest';
import { buildQuery, estaAtrasada, dateToIso, isoToDate, responsavelNome, TarefaDTO } from '../../pages/Tarefas/service';

function dto(partial: Partial<TarefaDTO>): TarefaDTO {
  return {
    id: '1',
    titulo: 'Teste',
    status: 'A_FAZER',
    prioridade: 'MEDIA',
    tipoResponsavel: 'ASSESSORA',
    usuarioResponsavelNome: null,
    influenciadorResponsavelNome: null,
    influenciadorNome: null,
    marcaNome: null,
    dataInicio: null,
    previsaoExecucao: null,
    previsaoTermino: null,
    dataConclusao: null,
    notificacaoAutomatica: false,
    totalChecklist: 0,
    checklistConcluidos: 0,
    ativo: true,
    ...partial,
  };
}

describe('buildQuery', () => {
  it('inclui sempre page e size', () => {
    expect(buildQuery(0, 10, {})).toEqual(['page=0', 'size=10']);
  });

  it('monta filtros multi-valor como comma-separated', () => {
    const query = buildQuery(1, 25, { status: ['A_FAZER', 'CONCLUIDA'], prioridade: ['ALTA'] });
    expect(query).toContain('status=A_FAZER,CONCLUIDA');
    expect(query).toContain('prioridade=ALTA');
  });

  it('ignora filtros vazios', () => {
    const query = buildQuery(0, 10, { status: [], textoDeBusca: '', atrasadas: false });
    expect(query).toEqual(['page=0', 'size=10']);
  });

  it('inclui intervalo de previsão e flags', () => {
    const query = buildQuery(0, 10, { previsaoDe: '2026-07-01', previsaoAte: '2026-07-31', atrasadas: true, mostrarInativos: true });
    expect(query).toContain('previsaoDe=2026-07-01');
    expect(query).toContain('previsaoAte=2026-07-31');
    expect(query).toContain('atrasadas=true');
    expect(query).toContain('mostrarInativos=true');
  });
});

describe('estaAtrasada', () => {
  it('false sem previsão de término', () => {
    expect(estaAtrasada(dto({ previsaoTermino: null }))).toBe(false);
  });

  it('true com previsão vencida e status aberto', () => {
    expect(estaAtrasada(dto({ previsaoTermino: '2020-01-01', status: 'EM_ANDAMENTO' }))).toBe(true);
  });

  it('false quando concluída ou cancelada, mesmo vencida', () => {
    expect(estaAtrasada(dto({ previsaoTermino: '2020-01-01', status: 'CONCLUIDA' }))).toBe(false);
    expect(estaAtrasada(dto({ previsaoTermino: '2020-01-01', status: 'CANCELADA' }))).toBe(false);
  });

  it('false com previsão futura', () => {
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 10);
    expect(estaAtrasada(dto({ previsaoTermino: dateToIso(futuro) }))).toBe(false);
  });
});

describe('datas', () => {
  it('isoToDate/dateToIso são inversas sem shift de fuso', () => {
    expect(dateToIso(isoToDate('2026-07-23'))).toBe('2026-07-23');
    expect(isoToDate(null)).toBeNull();
    expect(dateToIso(null)).toBeNull();
  });
});

describe('responsavelNome', () => {
  it('prioriza usuário, cai para influenciador, senão traço', () => {
    expect(responsavelNome(dto({ usuarioResponsavelNome: 'Ana' }))).toBe('Ana');
    expect(responsavelNome(dto({ influenciadorResponsavelNome: 'Influ' }))).toBe('Influ');
    expect(responsavelNome(dto({}))).toBe('—');
  });
});

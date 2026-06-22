import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDate, formatDateTime, isToday, parseDate } from '../../utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('deve formatar Date no formato dd/MM/yyyy por padrao', () => {
      const date = new Date(2024, 0, 15); // 15 de janeiro de 2024
      expect(formatDate(date)).toBe('15/01/2024');
    });

    it('deve formatar string ISO no formato dd/MM/yyyy', () => {
      const result = formatDate('2024-06-25T10:30:00');
      expect(result).toBe('25/06/2024');
    });

    it('deve aceitar formato customizado', () => {
      const date = new Date(2024, 11, 5); // 5 de dezembro de 2024
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2024-12-05');
    });

    it('deve retornar string vazia para data invalida', () => {
      expect(formatDate('data-invalida')).toBe('');
    });

    it('deve formatar com dia e mes com zero a esquerda', () => {
      const date = new Date(2024, 0, 5); // 5 de janeiro de 2024
      expect(formatDate(date)).toBe('05/01/2024');
    });
  });

  describe('formatDateTime', () => {
    it('deve formatar Date com data e hora', () => {
      const date = new Date(2024, 5, 15, 14, 30); // 15/06/2024 14:30
      expect(formatDateTime(date)).toBe('15/06/2024 14:30');
    });

    it('deve formatar string ISO com data e hora', () => {
      const result = formatDateTime('2024-03-10T08:05:00');
      expect(result).toBe('10/03/2024 08:05');
    });

    it('deve retornar string vazia para data invalida', () => {
      expect(formatDateTime('invalido')).toBe('');
    });

    it('deve formatar hora com zero a esquerda', () => {
      const date = new Date(2024, 0, 1, 3, 7);
      expect(formatDateTime(date)).toBe('01/01/2024 03:07');
    });
  });

  describe('isToday', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('deve retornar true para a data de hoje', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });

    it('deve retornar false para uma data diferente de hoje', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('deve aceitar string ISO representando hoje', () => {
      const todayISO = new Date().toISOString();
      expect(isToday(todayISO)).toBe(true);
    });

    it('deve retornar false para uma data futura', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(isToday(future)).toBe(false);
    });
  });

  describe('parseDate', () => {
    it('deve parsear data no formato BR (dd/MM/yyyy)', () => {
      const result = parseDate('25/12/2024');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getDate()).toBe(25);
      expect(result!.getMonth()).toBe(11); // dezembro = 11
      expect(result!.getFullYear()).toBe(2024);
    });

    it('deve parsear string ISO', () => {
      const result = parseDate('2024-06-15T10:00:00');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getFullYear()).toBe(2024);
    });

    it('deve retornar null para null', () => {
      expect(parseDate(null)).toBeNull();
    });

    it('deve retornar null para undefined', () => {
      expect(parseDate(undefined)).toBeNull();
    });

    it('deve retornar null para string vazia', () => {
      expect(parseDate('')).toBeNull();
    });

    it('deve retornar null para string invalida', () => {
      expect(parseDate('nao-e-data')).toBeNull();
    });

    it('deve parsear data BR com dia e mes com zero a esquerda', () => {
      const result = parseDate('01/03/2024');
      expect(result).toBeInstanceOf(Date);
      expect(result!.getDate()).toBe(1);
      expect(result!.getMonth()).toBe(2); // marco = 2
    });
  });
});

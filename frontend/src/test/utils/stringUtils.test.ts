import { describe, it, expect } from 'vitest';
import { capitalize, truncate, isEmpty } from '../../utils/stringUtils';

describe('stringUtils', () => {
  describe('capitalize', () => {
    it('deve capitalizar a primeira letra de uma string', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('deve manter string que ja comeca com maiuscula', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('deve retornar string vazia para string vazia', () => {
      expect(capitalize('')).toBe('');
    });

    it('deve capitalizar string com um unico caractere', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('deve capitalizar apenas a primeira letra e manter o resto', () => {
      expect(capitalize('hELLO WORLD')).toBe('HELLO WORLD');
    });
  });

  describe('truncate', () => {
    it('deve truncar string maior que o limite', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });

    it('deve retornar string original se menor que o limite', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });

    it('deve retornar string original se igual ao limite', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });

    it('deve retornar string vazia para string vazia', () => {
      expect(truncate('', 5)).toBe('');
    });

    it('deve truncar com limite zero', () => {
      expect(truncate('Hello', 0)).toBe('...');
    });
  });

  describe('isEmpty', () => {
    it('deve retornar true para string vazia', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('deve retornar true para null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('deve retornar true para undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('deve retornar true para string com apenas espacos', () => {
      expect(isEmpty('   ')).toBe(true);
    });

    it('deve retornar false para string com conteudo', () => {
      expect(isEmpty('hello')).toBe(false);
    });

    it('deve retornar false para string com espacos e conteudo', () => {
      expect(isEmpty('  hello  ')).toBe(false);
    });
  });
});

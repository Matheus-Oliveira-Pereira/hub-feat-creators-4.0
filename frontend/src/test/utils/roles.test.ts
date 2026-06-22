import { describe, it, expect } from 'vitest';
import {
  hasRole,
  canBrowse,
  canAdd,
  canChange,
  canDelete,
  getModulePrefixByPath,
  ROLE_SUFFIX,
  MODULES,
} from '../../utils/roles';

describe('roles', () => {
  describe('hasRole', () => {
    it('deve retornar true quando o usuario possui a role', () => {
      const roles = ['USRA', 'USRB', 'PRFB'];
      expect(hasRole(roles, 'USR', 'A')).toBe(true);
    });

    it('deve retornar false quando o usuario nao possui a role', () => {
      const roles = ['USRA', 'USRB'];
      expect(hasRole(roles, 'USR', 'D')).toBe(false);
    });

    it('deve retornar false para lista de roles vazia', () => {
      expect(hasRole([], 'USR', 'A')).toBe(false);
    });

    it('deve retornar false para prefixo inexistente', () => {
      const roles = ['USRA', 'USRB'];
      expect(hasRole(roles, 'XYZ', 'A')).toBe(false);
    });
  });

  describe('canBrowse', () => {
    it('deve retornar true quando usuario pode navegar no modulo USR', () => {
      const roles = ['USRB', 'USRA'];
      expect(canBrowse(roles, MODULES.USUARIOS.prefix)).toBe(true);
    });

    it('deve retornar false quando usuario nao pode navegar no modulo USR', () => {
      const roles = ['USRA', 'USRC'];
      expect(canBrowse(roles, MODULES.USUARIOS.prefix)).toBe(false);
    });

    it('deve retornar true quando usuario pode navegar no modulo PRF', () => {
      const roles = ['PRFB'];
      expect(canBrowse(roles, MODULES.PERFIS.prefix)).toBe(true);
    });

    it('deve retornar false quando usuario nao pode navegar no modulo PRF', () => {
      const roles = ['USRB'];
      expect(canBrowse(roles, MODULES.PERFIS.prefix)).toBe(false);
    });
  });

  describe('canAdd', () => {
    it('deve retornar true quando usuario pode adicionar no modulo USR', () => {
      const roles = ['USRA'];
      expect(canAdd(roles, MODULES.USUARIOS.prefix)).toBe(true);
    });

    it('deve retornar false quando usuario nao pode adicionar no modulo USR', () => {
      const roles = ['USRB'];
      expect(canAdd(roles, MODULES.USUARIOS.prefix)).toBe(false);
    });

    it('deve retornar true quando usuario pode adicionar no modulo PRF', () => {
      const roles = ['PRFA'];
      expect(canAdd(roles, MODULES.PERFIS.prefix)).toBe(true);
    });
  });

  describe('canChange', () => {
    it('deve retornar true quando usuario pode alterar no modulo USR', () => {
      const roles = ['USRC'];
      expect(canChange(roles, MODULES.USUARIOS.prefix)).toBe(true);
    });

    it('deve retornar false quando usuario nao pode alterar no modulo USR', () => {
      const roles = ['USRB', 'USRA'];
      expect(canChange(roles, MODULES.USUARIOS.prefix)).toBe(false);
    });

    it('deve retornar true quando usuario pode alterar no modulo PRF', () => {
      const roles = ['PRFC'];
      expect(canChange(roles, MODULES.PERFIS.prefix)).toBe(true);
    });
  });

  describe('canDelete', () => {
    it('deve retornar true quando usuario pode deletar no modulo USR', () => {
      const roles = ['USRD'];
      expect(canDelete(roles, MODULES.USUARIOS.prefix)).toBe(true);
    });

    it('deve retornar false quando usuario nao pode deletar no modulo USR', () => {
      const roles = ['USRA', 'USRB', 'USRC'];
      expect(canDelete(roles, MODULES.USUARIOS.prefix)).toBe(false);
    });

    it('deve retornar true quando usuario pode deletar no modulo PRF', () => {
      const roles = ['PRFD'];
      expect(canDelete(roles, MODULES.PERFIS.prefix)).toBe(true);
    });
  });

  describe('getModulePrefixByPath', () => {
    it('deve retornar prefixo USR para o path /usuarios', () => {
      expect(getModulePrefixByPath('/usuarios')).toBe('USR');
    });

    it('deve retornar prefixo PRF para o path /perfis', () => {
      expect(getModulePrefixByPath('/perfis')).toBe('PRF');
    });

    it('deve retornar null para um path desconhecido', () => {
      expect(getModulePrefixByPath('/desconhecido')).toBeNull();
    });

    it('deve retornar null para string vazia', () => {
      expect(getModulePrefixByPath('')).toBeNull();
    });
  });

  describe('constantes', () => {
    it('deve ter os sufixos corretos', () => {
      expect(ROLE_SUFFIX.ADD).toBe('A');
      expect(ROLE_SUFFIX.BROWSE).toBe('B');
      expect(ROLE_SUFFIX.CHANGE).toBe('C');
      expect(ROLE_SUFFIX.DELETE).toBe('D');
    });

    it('deve ter os modulos corretos', () => {
      expect(MODULES.USUARIOS.prefix).toBe('USR');
      expect(MODULES.USUARIOS.path).toBe('/usuarios');
      expect(MODULES.PERFIS.prefix).toBe('PRF');
      expect(MODULES.PERFIS.path).toBe('/perfis');
    });
  });
});

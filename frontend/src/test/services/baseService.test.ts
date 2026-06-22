import { describe, it, expect, vi, beforeEach } from 'vitest';
import BaseService from '../../services/baseService';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../../services/api';

interface TestEntity {
  id: string;
  nome: string;
}

describe('BaseService', () => {
  let service: BaseService<TestEntity>;

  beforeEach(() => {
    service = new BaseService<TestEntity>('/test');
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('deve buscar todos os registros', async () => {
      const mockData: TestEntity[] = [
        { id: '1', nome: 'Item 1' },
        { id: '2', nome: 'Item 2' },
      ];

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

      const result = await service.getAll();

      expect(api.get).toHaveBeenCalledWith('/test', { params: {} });
      expect(result).toEqual(mockData);
    });

    it('deve passar parametros de consulta', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] });

      await service.getAll({ page: 1, size: 10 });

      expect(api.get).toHaveBeenCalledWith('/test', { params: { page: 1, size: 10 } });
    });

    it('deve propagar erro da API', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Erro de rede'));

      await expect(service.getAll()).rejects.toThrow('Erro de rede');
    });
  });

  describe('getById', () => {
    it('deve buscar um registro por id', async () => {
      const mockData: TestEntity = { id: '1', nome: 'Item 1' };

      vi.mocked(api.get).mockResolvedValueOnce({ data: mockData });

      const result = await service.getById('1');

      expect(api.get).toHaveBeenCalledWith('/test/1');
      expect(result).toEqual(mockData);
    });

    it('deve propagar erro quando registro nao encontrado', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Not Found'));

      await expect(service.getById('999')).rejects.toThrow('Not Found');
    });
  });

  describe('create', () => {
    it('deve criar um novo registro', async () => {
      const newData = { nome: 'Novo Item' };
      const mockResponse: TestEntity = { id: '3', nome: 'Novo Item' };

      vi.mocked(api.post).mockResolvedValueOnce({ data: mockResponse });

      const result = await service.create(newData);

      expect(api.post).toHaveBeenCalledWith('/test', newData);
      expect(result).toEqual(mockResponse);
    });

    it('deve propagar erro de validacao', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Validacao falhou'));

      await expect(service.create({ nome: '' })).rejects.toThrow('Validacao falhou');
    });
  });

  describe('update', () => {
    it('deve atualizar um registro existente', async () => {
      const updateData = { nome: 'Item Atualizado' };
      const mockResponse: TestEntity = { id: '1', nome: 'Item Atualizado' };

      vi.mocked(api.put).mockResolvedValueOnce({ data: mockResponse });

      const result = await service.update('1', updateData);

      expect(api.put).toHaveBeenCalledWith('/test/1', updateData);
      expect(result).toEqual(mockResponse);
    });

    it('deve propagar erro quando registro nao existe', async () => {
      vi.mocked(api.put).mockRejectedValueOnce(new Error('Not Found'));

      await expect(service.update('999', { nome: 'teste' })).rejects.toThrow('Not Found');
    });
  });

  describe('remove', () => {
    it('deve remover um registro por id', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({});

      await service.remove('1');

      expect(api.delete).toHaveBeenCalledWith('/test/1');
    });

    it('deve propagar erro ao tentar remover registro inexistente', async () => {
      vi.mocked(api.delete).mockRejectedValueOnce(new Error('Not Found'));

      await expect(service.remove('999')).rejects.toThrow('Not Found');
    });
  });
});

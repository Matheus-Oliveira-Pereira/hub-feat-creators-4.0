import api from './api';

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

class BaseService<T = unknown> {
  private resourcePath: string;

  constructor(resourcePath: string) {
    this.resourcePath = resourcePath;
  }

  async getAll(params: Record<string, unknown> = {}): Promise<T[]> {
    const response = await api.get<T[]>(this.resourcePath, { params });
    return response.data;
  }

  async getPage(queryParams: string[] = []): Promise<PaginatedResponse<T>> {
    const queryString = queryParams.length ? '?' + queryParams.join('&') : '';
    const response = await api.get<PaginatedResponse<T>>(this.resourcePath + '/listar' + queryString);
    return response.data;
  }

  async getById(id: string): Promise<T> {
    const response = await api.get<T>(`${this.resourcePath}/${id}`);
    return response.data;
  }

  async create(data: Partial<T>): Promise<T> {
    const response = await api.post<T>(this.resourcePath, data);
    return response.data;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const response = await api.put<T>(`${this.resourcePath}/${id}`, data);
    return response.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`${this.resourcePath}/${id}`);
  }

  async desativar(id: string): Promise<void> {
    await api.patch(`${this.resourcePath}/${id}/desativar`);
  }

  async restaurar(id: string): Promise<void> {
    await api.patch(`${this.resourcePath}/${id}/restaurar`);
  }

  async getHistorico(id: string): Promise<unknown[]> {
    const response = await api.get<unknown[]>(`${this.resourcePath}/${id}/historico`);
    return response.data;
  }
}

export default BaseService;

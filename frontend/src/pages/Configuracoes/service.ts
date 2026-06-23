import api from '../../services/api';

export interface ModeloOption {
  id: string;
  nome: string;
}

export interface ConfiguracaoDTO {
  modelo: string;
  chaveConfigurada: boolean;
  modelosDisponiveis: ModeloOption[];
}

export interface ConfiguracaoForm {
  modelo: string;
  chave?: string;
}

export const configuracaoService = {
  obter: async (): Promise<ConfiguracaoDTO> => {
    const response = await api.get<ConfiguracaoDTO>('/configuracoes');
    return response.data;
  },

  salvar: async (data: ConfiguracaoForm): Promise<ConfiguracaoDTO> => {
    const response = await api.put<ConfiguracaoDTO>('/configuracoes', data);
    return response.data;
  },
};

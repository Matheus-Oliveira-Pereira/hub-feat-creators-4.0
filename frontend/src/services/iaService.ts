import api from './api';

export const iaService = {
  /** Envia o texto atual + um comando e devolve o texto editado pela IA. */
  editarTexto: async (texto: string, comando: string): Promise<string> => {
    const r = await api.post<{ texto: string }>('/ia/editar-texto', { texto, comando });
    return r.data.texto;
  },
};

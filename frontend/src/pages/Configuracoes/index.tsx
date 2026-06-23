import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import PageHeader from '../../components/PageHeader';
import { configuracaoService } from './service';
import './styles.scss';

function Configuracoes() {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);

  const [modelo, setModelo] = useState('');
  const [chave, setChave] = useState('');

  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracoes'],
    queryFn: () => configuracaoService.obter(),
  });

  useEffect(() => {
    if (config) setModelo(config.modelo);
  }, [config]);

  const salvarMutation = useMutation({
    mutationFn: () => configuracaoService.salvar({ modelo, chave: chave.trim() || undefined }),
    onSuccess: () => {
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Configurações salvas' });
      setChave('');
      queryClient.invalidateQueries({ queryKey: ['configuracoes'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao salvar' });
    },
  });

  return (
    <div className="crud-page">
      <Toast ref={toast} />
      <PageHeader title="Configurações" subtitle="Integração com o Claude (vision)" />

      <div className="content-card config-card">
        <div className="form-field">
          <label htmlFor="modelo">Modelo do Claude</label>
          <Dropdown
            id="modelo"
            value={modelo}
            options={config?.modelosDisponiveis ?? []}
            optionLabel="nome"
            optionValue="id"
            onChange={(e) => setModelo(e.value)}
            placeholder="Selecione o modelo"
            className="w-full"
            disabled={isLoading}
          />
          <small className="config-hint">Modelo usado para ler os prints e gerar os analytics.</small>
        </div>

        <div className="form-field">
          <label htmlFor="chave">Chave da API (ANTHROPIC_API_KEY)</label>
          <InputText
            id="chave"
            type="password"
            value={chave}
            onChange={(e) => setChave(e.target.value)}
            placeholder={config?.chaveConfigurada ? '•••••••••• (já configurada — preencha para alterar)' : 'sk-ant-...'}
            className="w-full"
            autoComplete="new-password"
          />
          <small className="config-hint">
            {config?.chaveConfigurada
              ? 'Chave já configurada. Deixe em branco para manter a atual.'
              : 'Nenhuma chave configurada ainda.'}
            {' '}Armazenada criptografada; nunca é exibida.
          </small>
        </div>

        <div className="config-actions">
          <Button label="Salvar" icon="pi pi-check" className="btn-salvar" onClick={() => salvarMutation.mutate()} loading={salvarMutation.isPending} />
        </div>
      </div>
    </div>
  );
}

export default Configuracoes;

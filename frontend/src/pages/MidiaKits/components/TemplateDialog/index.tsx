import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import StatusDropdown from '../../../../components/StatusDropdown';
import SessoesEditor, { sessaoVazia } from '../SessoesEditor';
import { baixarPdf } from '../MidiaKitDocument';
import { midiaKitService, MidiaKitTemplate, Sessao, InfluenciadorRef, sessoesPadrao, semearInfluenciador } from '../../service';
import './styles.scss';

interface TemplateDialogProps {
  visible: boolean;
  templateId: string | null;
  onHide: () => void;
  onToast: (severity: 'success' | 'error', detail: string) => void;
}

interface FormState {
  nome: string;
  influenciadorId: string | null;
  status: string;
  sessoes: Sessao[];
}

const VAZIO: FormState = { nome: '', influenciadorId: null, status: 'ATIVO', sessoes: sessoesPadrao() };

function TemplateDialog({ visible, templateId, onHide, onToast }: TemplateDialogProps) {
  const queryClient = useQueryClient();
  const editando = !!templateId;
  const [form, setForm] = useState<FormState>(VAZIO);
  const [submitted, setSubmitted] = useState(false);
  const [exportando, setExportando] = useState(false);

  const { data: influenciadores = [] } = useQuery({
    queryKey: ['influenciadores-ativos'],
    queryFn: () => midiaKitService.listarInfluenciadores(),
    staleTime: 5 * 60 * 1000,
    enabled: visible,
  });

  const { data: template } = useQuery({
    queryKey: ['midiakit-template', templateId],
    queryFn: () => midiaKitService.buscar(templateId!),
    enabled: visible && editando,
  });

  const influSelecionado: InfluenciadorRef | null = influenciadores.find((x) => x.id === form.influenciadorId) ?? null;

  useEffect(() => {
    if (!visible) return;
    if (editando && template) {
      const influ = template.influenciador;
      const sessoes = [...(template.sessoes ?? [])].sort((a, b) => a.ordem - b.ordem);
      setForm({
        nome: template.nome,
        influenciadorId: influ?.id ?? null,
        status: template.status,
        sessoes: influ ? semearInfluenciador(sessoes, influ) : sessoes,
      });
    } else if (!editando) {
      setForm(VAZIO);
    }
    setSubmitted(false);
  }, [visible, editando, template]);

  const selecionarInfluenciador = (id: string) => {
    const influ = influenciadores.find((x) => x.id === id) ?? null;
    setForm((f) => ({ ...f, influenciadorId: id, sessoes: influ ? semearInfluenciador(f.sessoes, influ) : f.sessoes }));
  };

  const payload = () => ({
    nome: form.nome,
    influenciador: form.influenciadorId ? { id: form.influenciadorId } : null,
    status: form.status,
    sessoes: form.sessoes.map((s, i) => ({ ...s, ordem: i })),
  });

  const salvarMutation = useMutation({
    mutationFn: () => (editando ? midiaKitService.atualizar(templateId!, payload()) : midiaKitService.salvar(payload())),
    onSuccess: () => {
      onToast('success', editando ? 'Template atualizado' : 'Template criado');
      queryClient.invalidateQueries({ queryKey: ['midia-kits'] });
      queryClient.invalidateQueries({ queryKey: ['midiakit-template', templateId] });
      onHide();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      onToast('error', e.response?.data?.message || 'Erro ao salvar');
    },
  });

  const validar = () => form.nome.trim().length > 0 && !!form.influenciadorId;

  const salvar = () => {
    setSubmitted(true);
    if (!validar()) return;
    const vazias = form.sessoes.filter(sessaoVazia);
    if (vazias.length > 0) {
      onToast('error', `Há ${vazias.length} seção(ões) sem conteúdo. Preencha ou remova antes de salvar.`);
      return;
    }
    salvarMutation.mutate();
  };

  const exportarPdf = async () => {
    if (!template) return;
    setExportando(true);
    try {
      const docTemplate: MidiaKitTemplate = {
        ...template,
        nome: form.nome,
        sessoes: form.sessoes.map((s, i) => ({ ...s, ordem: i })),
      };
      await baixarPdf(docTemplate);
    } catch {
      onToast('error', 'Falha ao gerar PDF');
    } finally {
      setExportando(false);
    }
  };

  const header = (
    <span className="p-dialog-title">
      <i className={editando ? 'pi pi-id-card' : 'pi pi-plus'} /> {editando ? 'Editar Template' : 'Novo Template de Mídia Kit'}
    </span>
  );

  const footer = (
    <div className="template-footer">
      {editando && (
        <Button label="Exportar PDF" icon="pi pi-file-pdf" className="btn-pdf" onClick={exportarPdf} loading={exportando} disabled={!template} />
      )}
      <span className="footer-spacer" />
      <Button label="Cancelar" icon="pi pi-times" className="btn-cancelar" onClick={onHide} />
      <Button label="Salvar" icon="pi pi-check" className="btn-salvar" onClick={salvar} loading={salvarMutation.isPending} />
    </div>
  );

  return (
    <Dialog visible={visible} onHide={onHide} header={header} footer={footer} style={{ width: '90vw', maxWidth: '1200px' }} modal draggable={false} className="template-dialog">
      <div className={`form-field ${submitted && !form.nome.trim() ? 'field-error' : ''}`}>
        <label htmlFor="nome">Nome do template <span className="required">*</span></label>
        <InputText id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full" />
      </div>

      <div className="form-grid-2">
        <div className={`form-field ${submitted && !form.influenciadorId ? 'field-error' : ''}`}>
          <label htmlFor="influ">Influenciador <span className="required">*</span></label>
          <Dropdown id="influ" value={form.influenciadorId} options={influenciadores} optionLabel="nome" optionValue="id"
            onChange={(e) => selecionarInfluenciador(e.value)} placeholder="Selecione" filter className="w-full" baseZIndex={10000} />
        </div>
        <div className="form-field">
          <label htmlFor="status">Status <span className="required">*</span></label>
          <StatusDropdown id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.value })} className="w-full" baseZIndex={10000} />
        </div>
      </div>

      <div className="form-field">
        <label>Seções do mídia kit</label>
        <SessoesEditor sessoes={form.sessoes} onChange={(sessoes) => setForm({ ...form, sessoes })} templateId={templateId} influenciador={influSelecionado} onToast={onToast} />
      </div>
    </Dialog>
  );
}

export default TemplateDialog;

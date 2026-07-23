import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import FormDialog from '../../../../components/FormDialog';
import StatusDropdown from '../../../../components/StatusDropdown';
import ContatosEditor from '../ContatosEditor';
import { comprimirImagem } from '../../../../utils/imagem';
import { marcaService, MarcaDTO, MarcaForm, Contato, contatoVazio, contatoInvalido } from '../../service';

interface MarcaFormDialogProps {
  visible: boolean;
  onHide: () => void;
  /** Preenchido = edição; vazio/null = novo cadastro. */
  editId?: string | null;
  /** Nome inicial ao cadastrar na hora (ex: texto já digitado no seletor). */
  defaultNome?: string;
  /** Chamado após salvar com sucesso, recebendo o registro criado/atualizado. */
  onSaved?: (saved: MarcaDTO) => void;
}

const FORM_VAZIO: MarcaForm = { nome: '', status: 'ATIVO', logotipo: '', linkFormulario: '', siteMarca: '', contatos: [] };

/**
 * Modal de cadastro/edição de Marca, autossuficiente (estado, lookups e mutation próprios).
 * Reutilizado pela página de Marcas e por seletores de marca espalhados pelo sistema.
 */
function MarcaFormDialog({ visible, onHide, editId, defaultNome, onSaved }: MarcaFormDialogProps) {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<MarcaForm>(FORM_VAZIO);
  const [submitted, setSubmitted] = useState(false);
  const editando = !!editId;

  useEffect(() => {
    if (!visible) return;
    setSubmitted(false);
    if (editId) {
      marcaService.buscar(editId).then((data) => {
        setForm({
          nome: data.nome,
          status: data.status,
          logotipo: data.logotipo ?? '',
          linkFormulario: data.linkFormulario ?? '',
          siteMarca: data.siteMarca ?? '',
          contatos: (data.contatos || []).map((c) => ({ id: c.id, nome: c.nome ?? '', email: c.email ?? '', telefone: c.telefone ?? '' })),
        });
      }).catch(() => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar marca' }));
    } else {
      setForm({ ...FORM_VAZIO, nome: defaultNome ?? '' });
    }
  }, [visible, editId, defaultNome]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['marcas'] });
    queryClient.invalidateQueries({ queryKey: ['marcas-ativas'] });
  };

  const salvarMutation = useMutation({
    mutationFn: () => {
      const payload: MarcaForm = { ...form, contatos: form.contatos.filter((c) => !contatoVazio(c)) };
      return editando ? marcaService.atualizar(editId!, payload) : marcaService.salvar(payload);
    },
    onSuccess: (saved) => {
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: editando ? 'Marca atualizada' : 'Marca criada' });
      invalidate();
      onSaved?.(saved);
      onHide();
    },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao salvar' }); },
  });

  const carregarLogotipo = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const dataUrl = await comprimirImagem(files[0]);
      setForm((f) => ({ ...f, logotipo: dataUrl }));
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar o logotipo' });
    }
    if (logoRef.current) logoRef.current.value = '';
  };

  const validar = (): boolean => {
    if (!form.nome.trim()) return false;
    return !form.contatos.some(contatoInvalido);
  };

  const salvar = () => {
    setSubmitted(true);
    if (!validar()) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'Verifique o nome e os contatos.' });
      return;
    }
    salvarMutation.mutate();
  };

  return (
    <>
      <Toast ref={toast} />
      <FormDialog visible={visible} onHide={onHide} title={editando ? 'Editar Marca' : 'Nova Marca'} icon={editando ? 'pi pi-pencil' : 'pi pi-plus'} onSave={salvar} loading={salvarMutation.isPending} width="640px">
        <div className={`form-field ${submitted && !form.nome.trim() ? 'field-error' : ''}`}>
          <label htmlFor="nome">Nome <span className="required">*</span></label>
          <InputText id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full" />
          {submitted && !form.nome.trim() && <small className="p-error"><i className="pi pi-exclamation-circle" />Nome é obrigatório</small>}
        </div>
        <div className="form-field">
          <label htmlFor="logotipo">Logotipo</label>
          <div className="logo-upload">
            {form.logotipo
              ? (
                <div className="logo-preview">
                  <img src={form.logotipo} alt="Logotipo" />
                  <button type="button" onClick={() => setForm({ ...form, logotipo: '' })} title="Remover"><i className="pi pi-times" /></button>
                </div>
              )
              : (
                <label className="logo-add">
                  <i className="pi pi-upload" /> Enviar imagem
                  <input ref={logoRef} id="logotipo" type="file" accept="image/*" onChange={(e) => carregarLogotipo(e.target.files)} />
                </label>
              )}
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="linkFormulario">Link do formulário</label>
          <InputText id="linkFormulario" value={form.linkFormulario ?? ''} onChange={(e) => setForm({ ...form, linkFormulario: e.target.value })} className="w-full" placeholder="https://..." />
        </div>
        <div className="form-field">
          <label htmlFor="siteMarca">Site da marca</label>
          <InputText id="siteMarca" value={form.siteMarca ?? ''} onChange={(e) => setForm({ ...form, siteMarca: e.target.value })} className="w-full" placeholder="https://..." />
        </div>
        <div className="form-field">
          <ContatosEditor contatos={form.contatos} onChange={(contatos: Contato[]) => setForm({ ...form, contatos })} submitted={submitted} />
        </div>
        <div className="form-field">
          <label htmlFor="status">Status <span className="required">*</span></label>
          <StatusDropdown id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.value })} className="w-full" baseZIndex={10000} />
        </div>
      </FormDialog>
    </>
  );
}

export default MarcaFormDialog;

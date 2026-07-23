import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import FormDialog from '../../../../components/FormDialog';
import StatusDropdown from '../../../../components/StatusDropdown';
import RoleBoards from '../RoleBoards';
import { perfilService, PerfilDTO, PerfilForm } from '../../service';

interface PerfilFormDialogProps {
  visible: boolean;
  onHide: () => void;
  editId?: string | null;
  defaultNome?: string;
  onSaved?: (saved: PerfilDTO) => void;
}

interface FormErrors { descricao?: string; }

/** Modal autossuficiente de cadastro/edição de Perfil. */
function PerfilFormDialog({ visible, onHide, editId, defaultNome, onSaved }: PerfilFormDialogProps) {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);

  const [form, setForm] = useState<PerfilForm>({ descricao: '', status: 'ATIVO', roles: [] });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const editando = !!editId;

  useEffect(() => {
    if (!visible) return;
    setErrors({}); setSubmitted(false);
    if (editId) {
      perfilService.buscar(editId).then((data) => {
        const rolesArr = Array.isArray(data.roles) ? data.roles.map((r: unknown) => typeof r === 'string' ? r : (r as { name?: string }).name || String(r)) : [];
        setForm({ descricao: data.descricao, status: data.status, roles: rolesArr });
      }).catch(() => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar perfil' }));
    } else {
      setForm({ descricao: defaultNome ?? '', status: 'ATIVO', roles: [] });
    }
  }, [visible, editId, defaultNome]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['perfis'] });

  const salvarMutation = useMutation({
    mutationFn: () => editando ? perfilService.atualizar(editId!, form) : perfilService.salvar(form),
    onSuccess: (saved) => {
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: editando ? 'Perfil atualizado' : 'Perfil criado' });
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['perfis-options'] });
      onSaved?.(saved as PerfilDTO);
      onHide();
    },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao salvar' }); },
  });

  const validar = (): boolean => {
    const errs: FormErrors = {};
    if (!form.descricao.trim()) errs.descricao = 'Descrição é obrigatória';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const salvar = () => { setSubmitted(true); if (!validar()) return; salvarMutation.mutate(); };

  return (
    <>
      <Toast ref={toast} />
      <FormDialog visible={visible} onHide={onHide} title={editando ? 'Editar Perfil' : 'Novo Perfil'} icon={editando ? 'pi pi-shield' : 'pi pi-plus-circle'} onSave={salvar} loading={salvarMutation.isPending} width="600px">
        <div className={`form-field ${submitted && errors.descricao ? 'field-error' : ''}`}>
          <label htmlFor="descricao">Descrição <span className="required">*</span></label>
          <InputText id="descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full" />
          {submitted && errors.descricao && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.descricao}</small>}
        </div>
        <div className="form-field">
          <label htmlFor="status">Status <span className="required">*</span></label>
          <StatusDropdown id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.value })} className="w-full" baseZIndex={10000} />
        </div>
        <RoleBoards selectedRoles={form.roles} onChange={(r) => setForm({ ...form, roles: r })} />
      </FormDialog>
    </>
  );
}

export default PerfilFormDialog;

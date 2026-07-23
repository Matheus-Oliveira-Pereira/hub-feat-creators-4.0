import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import FormDialog from '../../../../components/FormDialog';
import StatusDropdown from '../../../../components/StatusDropdown';
import SelectComCadastro from '../../../../components/SelectComCadastro';
import { useAuth } from '../../../../contexts/AuthContext';
import { canAdd, MODULES } from '../../../../utils/roles';
import { influenciadorService, InfluenciadorDTO, InfluenciadorForm } from '../../service';
import { contaEmailService } from '../../../ContasEmail/service';
import ContaEmailFormDialog from '../../../ContasEmail/components/ContaEmailFormDialog';

interface InfluenciadorFormDialogProps {
  visible: boolean;
  onHide: () => void;
  editId?: string | null;
  defaultNome?: string;
  onSaved?: (saved: InfluenciadorDTO) => void;
}

interface FormErrors { nome?: string; email?: string; }

const FORM_VAZIO: InfluenciadorForm = {
  nome: '', email: '', telefone: '', instagram: '', tiktok: '', linkedin: '', youtube: '', discord: '',
  nicho: '', subnicho: '', foto: '', status: 'ATIVO', contaEmailId: '',
};

/** Modal autossuficiente de cadastro/edição de Influenciador. */
function InfluenciadorFormDialog({ visible, onHide, editId, defaultNome, onSaved }: InfluenciadorFormDialogProps) {
  const queryClient = useQueryClient();
  const toast = useRef<Toast>(null);
  const { user: authUser } = useAuth();

  const [form, setForm] = useState<InfluenciadorForm>(FORM_VAZIO);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [contaDialogVisible, setContaDialogVisible] = useState(false);
  const editando = !!editId;

  const podeAddConta = canAdd(authUser?.roles ?? [], MODULES.CONTAS_EMAIL.prefix);

  const { data: contasEmail } = useQuery({
    queryKey: ['contas-email-options'],
    queryFn: () => contaEmailService.listarAtivos(),
    enabled: visible,
  });

  useEffect(() => {
    if (!visible) return;
    setErrors({}); setSubmitted(false);
    if (editId) {
      influenciadorService.buscar(editId).then((data) => {
        setForm({
          nome: data.nome, email: data.email,
          telefone: data.telefone ?? '', instagram: data.instagram ?? '', tiktok: data.tiktok ?? '',
          linkedin: data.linkedin ?? '', youtube: data.youtube ?? '', discord: data.discord ?? '',
          nicho: data.nicho ?? '', subnicho: data.subnicho ?? '', foto: data.foto ?? '', status: data.status,
          contaEmailId: data.contaEmail?.id ?? '',
        });
      }).catch(() => toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar influenciador' }));
    } else {
      setForm({ ...FORM_VAZIO, nome: defaultNome ?? '' });
    }
  }, [visible, editId, defaultNome]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['influenciadores'] });
    queryClient.invalidateQueries({ queryKey: ['influenciadores-ativos'] });
  };

  const salvarMutation = useMutation({
    mutationFn: async () => {
      const { contaEmailId, ...rest } = form;
      const payload = { ...rest, contaEmail: contaEmailId ? { id: contaEmailId } : null };
      return editando ? influenciadorService.atualizar(editId!, payload) : influenciadorService.salvar(payload);
    },
    onSuccess: (saved) => {
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: editando ? 'Influenciador atualizado' : 'Influenciador criado' });
      invalidate();
      onSaved?.(saved as InfluenciadorDTO);
      onHide();
    },
    onError: (err: unknown) => { const e = err as { response?: { data?: { message?: string } } }; toast.current?.show({ severity: 'error', summary: 'Erro', detail: e.response?.data?.message || 'Erro ao salvar' }); },
  });

  const validar = (): boolean => {
    const errs: FormErrors = {};
    if (!form.nome.trim()) errs.nome = 'Nome é obrigatório';
    if (!form.email.trim()) errs.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'E-mail inválido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const salvar = () => { setSubmitted(true); if (!validar()) return; salvarMutation.mutate(); };

  return (
    <>
      <Toast ref={toast} />
      <FormDialog visible={visible} onHide={onHide} title={editando ? 'Editar Influenciador' : 'Novo Influenciador'} icon={editando ? 'pi pi-user-edit' : 'pi pi-user-plus'} onSave={salvar} loading={salvarMutation.isPending}>
        <div className={`form-field ${submitted && errors.nome ? 'field-error' : ''}`}>
          <label htmlFor="nome">Nome <span className="required">*</span></label>
          <InputText id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="w-full" />
          {submitted && errors.nome && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.nome}</small>}
        </div>
        <div className={`form-field ${submitted && errors.email ? 'field-error' : ''}`}>
          <label htmlFor="email">E-mail <span className="required">*</span></label>
          <InputText id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full" />
          {submitted && errors.email && <small className="p-error"><i className="pi pi-exclamation-circle" />{errors.email}</small>}
        </div>
        <div className="form-field">
          <label htmlFor="telefone">Telefone</label>
          <InputText id="telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="w-full" />
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="instagram"><i className="pi pi-instagram" /> Instagram</label>
            <InputText id="instagram" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} className="w-full" placeholder="@usuario" />
          </div>
          <div className="form-field">
            <label htmlFor="tiktok"><i className="pi pi-video" /> TikTok</label>
            <InputText id="tiktok" value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} className="w-full" placeholder="@usuario" />
          </div>
          <div className="form-field">
            <label htmlFor="linkedin"><i className="pi pi-linkedin" /> LinkedIn</label>
            <InputText id="linkedin" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="w-full" />
          </div>
          <div className="form-field">
            <label htmlFor="youtube"><i className="pi pi-youtube" /> YouTube</label>
            <InputText id="youtube" value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} className="w-full" />
          </div>
          <div className="form-field">
            <label htmlFor="discord"><i className="pi pi-discord" /> Discord</label>
            <InputText id="discord" value={form.discord} onChange={(e) => setForm({ ...form, discord: e.target.value })} className="w-full" placeholder="Servidor / convite" />
          </div>
        </div>
        <div className="form-grid-2">
          <div className="form-field">
            <label htmlFor="nicho">Nicho</label>
            <InputText id="nicho" value={form.nicho} onChange={(e) => setForm({ ...form, nicho: e.target.value })} className="w-full" placeholder="Ex: Tecnologia" />
          </div>
          <div className="form-field">
            <label htmlFor="subnicho">Subnicho</label>
            <InputText id="subnicho" value={form.subnicho} onChange={(e) => setForm({ ...form, subnicho: e.target.value })} className="w-full" placeholder="Ex: Programação & IA" />
          </div>
        </div>
        <div className="form-field">
          <label htmlFor="foto">Foto (URL)</label>
          <InputText id="foto" value={form.foto} onChange={(e) => setForm({ ...form, foto: e.target.value })} className="w-full" placeholder="https://..." />
          {form.foto.trim() && <img src={form.foto} alt="Pré-visualização" className="influ-foto-preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
        </div>
        <div className="form-field">
          <label htmlFor="contaEmail"><i className="pi pi-at" /> Conta de e-mail (remetente)</label>
          <SelectComCadastro onAdd={() => setContaDialogVisible(true)} visivel={podeAddConta} title="Cadastrar nova conta de e-mail">
            <Dropdown id="contaEmail" value={form.contaEmailId} options={contasEmail ?? []} optionLabel="nome" optionValue="id"
              onChange={(e) => setForm({ ...form, contaEmailId: e.value })} placeholder="Usar conta do sistema (padrão)" className="w-full"
              showClear baseZIndex={10000} />
          </SelectComCadastro>
          <small className="config-hint">Se vazio, prospecções usam a conta do sistema.</small>
        </div>
        <div className="form-field">
          <label htmlFor="status">Status <span className="required">*</span></label>
          <StatusDropdown id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.value })} className="w-full" baseZIndex={10000} />
        </div>
      </FormDialog>

      <ContaEmailFormDialog
        visible={contaDialogVisible}
        onHide={() => setContaDialogVisible(false)}
        onSaved={(conta) => {
          queryClient.invalidateQueries({ queryKey: ['contas-email-options'] });
          setForm((f) => ({ ...f, contaEmailId: conta.id }));
        }}
      />
    </>
  );
}

export default InfluenciadorFormDialog;

import { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import BaseService from '../services/baseService';
import api, { onApiForbidden } from '../services/api';
import { formatDateTime } from '../utils/dateUtils';

const usuarioService = new BaseService('/usuarios');

interface ApiError {
  response?: { data?: { message?: string } };
}

function Template() {
  const { user, ultimoLogin, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  useEffect(() => {
    onApiForbidden((message) => {
      toast.current?.show({
        severity: 'warn',
        summary: 'Acesso Negado',
        detail: message || 'Você não tem permissão para executar esta ação.',
      });
    });
    return () => onApiForbidden(null);
  }, []);

  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [senhaDialogVisible, setSenhaDialogVisible] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', email: '' });
  const [senhaForm, setSenhaForm] = useState({ senhaAtual: '', novaSenha: '', confirmar: '' });

  const abrirEdicaoPerfil = () => {
    setEditForm({ nome: user?.nome || '', email: user?.email || '' });
    setEditDialogVisible(true);
  };

  const salvarPerfil = async () => {
    try {
      await usuarioService.update(user?.id || '', { nome: editForm.nome, email: editForm.email });
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado' });
      setEditDialogVisible(false);
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar perfil' });
    }
  };

  const abrirTrocaSenha = () => {
    setSenhaForm({ senhaAtual: '', novaSenha: '', confirmar: '' });
    setEditDialogVisible(false);
    setSenhaDialogVisible(true);
  };

  const salvarSenha = async () => {
    if (senhaForm.novaSenha.length < 4) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'A nova senha deve ter no mínimo 4 caracteres.' });
      return;
    }
    if (senhaForm.novaSenha !== senhaForm.confirmar) {
      toast.current?.show({ severity: 'warn', summary: 'Atenção', detail: 'A confirmação não confere com a nova senha.' });
      return;
    }
    try {
      await api.patch('/usuarios/me/senha', { senhaAtual: senhaForm.senhaAtual, novaSenha: senhaForm.novaSenha });
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Senha alterada' });
      setSenhaDialogVisible(false);
    } catch (e) {
      const msg = (e as ApiError)?.response?.data?.message || 'Erro ao alterar senha';
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: msg });
    }
  };

  const confirmarLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout-wrapper">
      <Toast ref={toast} />
      <Sidebar />
      <div className="layout-main">
        <Topbar onEditProfile={abrirEdicaoPerfil} onLogout={() => setLogoutDialogVisible(true)} />
        <div className="layout-content">
          <Outlet />
        </div>
      </div>

      <FormDialog visible={editDialogVisible} onHide={() => setEditDialogVisible(false)} title="Meu Perfil" icon="pi pi-user-edit" onSave={salvarPerfil} width="450px">
        <div className="form-field">
          <label htmlFor="edit-nome">Nome</label>
          <InputText id="edit-nome" value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="edit-email">E-mail</label>
          <InputText id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full" />
        </div>
        <div className="form-field">
          <span className="form-field-label">Último acesso</span>
          <span className="perfil-ultimo-acesso">{ultimoLogin ? formatDateTime(ultimoLogin) : 'Primeiro acesso'}</span>
        </div>
        <div className="form-field">
          <button type="button" className="p-button p-button-text p-button-sm" onClick={abrirTrocaSenha}>
            <i className="pi pi-key" style={{ marginRight: 8 }} /> Trocar senha
          </button>
        </div>
      </FormDialog>

      <FormDialog visible={senhaDialogVisible} onHide={() => setSenhaDialogVisible(false)} title="Trocar Senha" icon="pi pi-key" onSave={salvarSenha} width="450px">
        <div className="form-field">
          <label htmlFor="senha-atual">Senha atual</label>
          <InputText id="senha-atual" type="password" value={senhaForm.senhaAtual} onChange={(e) => setSenhaForm({ ...senhaForm, senhaAtual: e.target.value })} className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="senha-nova">Nova senha</label>
          <InputText id="senha-nova" type="password" value={senhaForm.novaSenha} onChange={(e) => setSenhaForm({ ...senhaForm, novaSenha: e.target.value })} className="w-full" />
        </div>
        <div className="form-field">
          <label htmlFor="senha-confirmar">Confirmar nova senha</label>
          <InputText id="senha-confirmar" type="password" value={senhaForm.confirmar} onChange={(e) => setSenhaForm({ ...senhaForm, confirmar: e.target.value })} className="w-full" />
        </div>
      </FormDialog>

      <ConfirmDialog visible={logoutDialogVisible} onHide={() => setLogoutDialogVisible(false)} onConfirm={confirmarLogout} title="Confirmar Saída" icon="pi pi-sign-out" message="Tem certeza que deseja sair do sistema?" confirmLabel="Sair" confirmIcon="pi pi-sign-out" className="logout-dialog" />
    </div>
  );
}

export default Template;

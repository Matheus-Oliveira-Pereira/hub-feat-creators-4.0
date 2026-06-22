import { useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import FormDialog from '../components/FormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import BaseService from '../services/baseService';

const usuarioService = new BaseService('/usuarios');

function Template() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useRef<Toast>(null);

  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [editForm, setEditForm] = useState({ nome: '', email: '', senha: '' });

  const abrirEdicaoPerfil = () => {
    setEditForm({ nome: user?.nome || '', email: user?.email || '', senha: '' });
    setEditDialogVisible(true);
  };

  const salvarPerfil = async () => {
    try {
      const payload: Record<string, string> = { nome: editForm.nome, email: editForm.email };
      if (editForm.senha) payload.senha = editForm.senha;
      await usuarioService.update(user?.id || '', payload);
      toast.current?.show({ severity: 'success', summary: 'Sucesso', detail: 'Perfil atualizado' });
      setEditDialogVisible(false);
    } catch {
      toast.current?.show({ severity: 'error', summary: 'Erro', detail: 'Erro ao atualizar perfil' });
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
          <label htmlFor="edit-senha">Nova Senha <small>(deixe em branco para manter)</small></label>
          <InputText id="edit-senha" type="password" value={editForm.senha} onChange={(e) => setEditForm({ ...editForm, senha: e.target.value })} className="w-full" />
        </div>
      </FormDialog>

      <ConfirmDialog visible={logoutDialogVisible} onHide={() => setLogoutDialogVisible(false)} onConfirm={confirmarLogout} title="Confirmar Saída" icon="pi pi-sign-out" message="Tem certeza que deseja sair do sistema?" confirmLabel="Sair" confirmIcon="pi pi-sign-out" className="logout-dialog" />
    </div>
  );
}

export default Template;

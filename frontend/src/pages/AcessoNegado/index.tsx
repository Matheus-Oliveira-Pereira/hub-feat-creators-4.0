import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import './styles.scss';

function AcessoNegado() {
  const navigate = useNavigate();

  return (
    <div className="acesso-negado-page">
      <div className="acesso-negado-card">
        <div className="acesso-negado-icon">
          <i className="pi pi-ban" />
        </div>
        <h1>Acesso Negado</h1>
        <p>Você não possui permissão para acessar esta página.</p>
        <p className="sub">Solicite as permissões necessárias ao administrador do sistema.</p>
        <Button
          label="Voltar ao Dashboard"
          icon="pi pi-arrow-left"
          className="btn-salvar mt-3"
          onClick={() => navigate('/')}
        />
      </div>
    </div>
  );
}

export default AcessoNegado;

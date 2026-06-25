import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.svg';
import './styles.scss';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await login(email, senha);
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErro(axiosErr.response?.data?.message || 'Credenciais inválidas. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-orb orb-1" />
        <div className="login-orb orb-2" />
        <div className="login-orb orb-3" />
      </div>

      <div className="login-container">
        <div className="login-branding">
          <div className="branding-content">
            <img src={logo} alt="Feat Creators" className="branding-logo-img" />
            <h1>Hub de assessoria de criadores</h1>
            <p>Gestão integrada de influenciadores, marcas e mídia kits</p>
            <div className="branding-features">
              <div className="feature"><i className="pi pi-star" /><span>Gestão completa de influenciadores</span></div>
              <div className="feature"><i className="pi pi-id-card" /><span>Mídia kits automáticos em PDF</span></div>
              <div className="feature"><i className="pi pi-chart-line" /><span>Insights de redes com IA</span></div>
            </div>
          </div>
        </div>

        <div className="login-form-wrapper">
          <div className="login-card">
            <div className="login-header">
              <h2>Bem-vindo de volta</h2>
              <p>Acesse sua conta para continuar</p>
            </div>

            {erro && (
              <div className="login-error">
                <i className="pi pi-exclamation-circle" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <label htmlFor="email">E-mail</label>
                <div className="input-wrapper">
                  <i className="pi pi-envelope input-icon" />
                  <InputText
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="senha">Senha</label>
                <div className="input-wrapper">
                  <i className="pi pi-lock input-icon" />
                  <InputText
                    id="senha"
                    type={senhaVisivel ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setSenhaVisivel(!senhaVisivel)}
                    tabIndex={-1}
                  >
                    <i className={senhaVisivel ? 'pi pi-eye-slash' : 'pi pi-eye'} />
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                label="Entrar"
                icon="pi pi-arrow-right"
                iconPos="right"
                loading={carregando}
                className="login-btn w-full"
              />
            </form>

            <div className="login-footer">
              <span>Ambiente de desenvolvimento</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Usuarios from '../pages/Usuarios';
import Perfis from '../pages/Perfis';
import Influenciadores from '../pages/Influenciadores';
import Marcas from '../pages/Marcas';
import MidiaKits from '../pages/MidiaKits';
import Configuracoes from '../pages/Configuracoes';
import ContasEmail from '../pages/ContasEmail';
import EmailLogs from '../pages/EmailLogs';
import Prospecao from '../pages/Prospecao';
import Publicidade from '../pages/Publicidade';
import TemplatesEmail from '../pages/TemplatesEmail';
import AcessoNegado from '../pages/AcessoNegado';
import Template from './Template';
import RequireAuth from './Requisitos/RequireAuth';
import RequireRole from './Requisitos/RequireRole';

function Rotas() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><Template /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="usuarios" element={<RequireRole role="USRB"><Usuarios /></RequireRole>} />
          <Route path="perfis" element={<RequireRole role="PRFB"><Perfis /></RequireRole>} />
          <Route path="influenciadores" element={<RequireRole role="INFB"><Influenciadores /></RequireRole>} />
          <Route path="marcas" element={<RequireRole role="MRCB"><Marcas /></RequireRole>} />
          <Route path="midia-kits" element={<RequireRole role="MDKB"><MidiaKits /></RequireRole>} />
          <Route path="prospecao" element={<RequireRole role="PSPB"><Prospecao /></RequireRole>} />
          <Route path="publicidade" element={<RequireRole role="PUBB"><Publicidade /></RequireRole>} />
          <Route path="configuracoes" element={<RequireRole role="CFGB"><Configuracoes /></RequireRole>} />
          <Route path="contas-email" element={<RequireRole role="CTEB"><ContasEmail /></RequireRole>} />
          <Route path="email-logs" element={<RequireRole role="EMLB"><EmailLogs /></RequireRole>} />
          <Route path="templates-email" element={<RequireRole role="TMEB"><TemplatesEmail /></RequireRole>} />
          <Route path="acesso-negado" element={<AcessoNegado />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default Rotas;

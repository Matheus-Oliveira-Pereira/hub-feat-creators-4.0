import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Usuarios from '../pages/Usuarios';
import Perfis from '../pages/Perfis';
import Influenciadores from '../pages/Influenciadores';
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
          <Route path="acesso-negado" element={<AcessoNegado />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default Rotas;

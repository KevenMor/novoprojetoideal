import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UnitFilterProvider } from './contexts/UnitFilterContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import EnviarMensagem from './pages/EnviarMensagem';
import CadastrarContasBTG from './pages/CadastrarContasBTG';
import HistoricoContasBTG from './pages/HistoricoContasBTG';
import RegistrarCobrancas from './pages/RegistrarCobrancas';
import Extratos from './pages/Extratos';
import ConfiguracaoSheets from './pages/ConfiguracaoSheets';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import Perfil from './pages/Perfil';
import Configuracoes from './pages/Configuracoes';
import TestPermissions from './pages/TestPermissions';
import DebugAuth from './pages/DebugAuth';
import DebugUser from './pages/DebugUser';
import DebugFirebase from './pages/DebugFirebase';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UnitFilterProvider>
          <Router>
            <div className="App">
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    theme: {
                      primary: '#4aed88',
                    },
                  },
                }}
              />
              
              <Routes>
                {/* Rota de login */}
                <Route path="/login" element={<Login />} />
                
                {/* Rotas protegidas */}
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="mensagem" element={<EnviarMensagem />} />
                  <Route path="contas-btg" element={<CadastrarContasBTG />} />
                  <Route path="historico-contas-btg" element={<HistoricoContasBTG />} />
                  <Route path="cobrancas" element={<RegistrarCobrancas />} />
                  <Route path="extratos" element={<Extratos />} />
                  <Route path="configuracao-sheets" element={<ConfiguracaoSheets />} />
                  <Route path="usuarios" element={<GerenciarUsuarios />} />
                  <Route path="perfil" element={<Perfil />} />
                  <Route path="configuracoes" element={<Configuracoes />} />
                  
                  {/* Rotas de debug */}
                  <Route path="test-permissions" element={<TestPermissions />} />
                  <Route path="debug-auth" element={<DebugAuth />} />
                  <Route path="debug-user" element={<DebugUser />} />
                  <Route path="debug-firebase" element={<DebugFirebase />} />
                </Route>
                
                {/* Rota padrão */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </Router>
        </UnitFilterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 
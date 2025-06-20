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
import ConfiguracaoSheets from './pages/ConfiguracaoSheets';
import CadastrarContasBTG from './pages/CadastrarContasBTG';
import GestaoContasBTG from './pages/GestaoContasBTG';
import Extratos from './pages/Extratos';
import EnviarMensagem from './pages/EnviarMensagem';
import GerenciarModelosMensagem from './pages/GerenciarModelosMensagem';
import HistoricoMensagens from './pages/HistoricoMensagens';
import GerenciarUsuarios from './pages/GerenciarUsuarios';
import RegistrarCobranca from './pages/RegistrarCobranca';
import RegistrarCobrancas from './pages/RegistrarCobrancas';
import HistoricoCobrancas from './pages/HistoricoCobrancas';
import FolhaPagamento from './pages/FolhaPagamento';
import Perfil from './pages/Perfil';
import Configuracoes from './pages/Configuracoes';
import CadastroRapidoFuncionarios from './pages/CadastroRapidoFuncionarios';
import CadastroRapidoVilaProgresso from './pages/CadastroRapidoVilaProgresso';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <UnitFilterProvider>
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
                <Route path="/login" element={<Login />} />
                
                <Route path="/" element={
                  <PrivateRoute>
                    <Layout />
                  </PrivateRoute>
                }>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="configuracao-sheets" element={<ConfiguracaoSheets />} />
                  <Route path="cadastrar-contas-btg" element={<CadastrarContasBTG />} />
                  <Route path="gestao-contas-btg" element={<GestaoContasBTG />} />
                  <Route path="extratos" element={<Extratos />} />
                  <Route path="enviar-mensagem" element={<EnviarMensagem />} />
                  <Route path="gerenciar-modelos-mensagem" element={<GerenciarModelosMensagem />} />
                  <Route path="historico-mensagens" element={<HistoricoMensagens />} />
                  <Route path="gerenciar-usuarios" element={<GerenciarUsuarios />} />
                  <Route path="registrar-cobranca" element={<RegistrarCobranca />} />
                  <Route path="registrar-cobrancas" element={<RegistrarCobrancas />} />
                  <Route path="historico-cobrancas" element={<HistoricoCobrancas />} />
                  <Route path="folha-pagamento" element={<FolhaPagamento />} />
                  <Route path="perfil" element={<Perfil />} />
                  <Route path="configuracoes" element={<Configuracoes />} />
                  <Route path="cadastro-rapido-funcionarios" element={<CadastroRapidoFuncionarios />} />
                  <Route path="cadastro-rapido-vila-progresso" element={<CadastroRapidoVilaProgresso />} />
                </Route>

                {/* Rota padrão */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </UnitFilterProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 
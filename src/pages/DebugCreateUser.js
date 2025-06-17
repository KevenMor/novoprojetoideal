import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getPermissionsByProfile } from '../utils/permissions';
import toast from 'react-hot-toast';

export default function DebugCreateUser() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: 'Usuário Teste Debug',
    email: 'teste.debug@autoescola.com',
    senha: '123456',
    perfil: 'operator',
    unidades: ['Aparecidinha']
  });

  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const testCreateUser = async () => {
    setLoading(true);
    clearLogs();
    
    try {
      addLog('🚀 Iniciando teste de criação de usuário', 'info');
      addLog(`📧 Email: ${formData.email}`, 'info');
      addLog(`👤 Nome: ${formData.nome}`, 'info');
      addLog(`🏢 Unidades: ${formData.unidades.join(', ')}`, 'info');
      
      // Verificar configuração do Firebase
      addLog('🔧 Verificando configuração do Firebase...', 'info');
      addLog(`🌐 Project ID: ${auth.app.options.projectId}`, 'info');
      addLog(`🔑 API Key: ${auth.app.options.apiKey.substring(0, 10)}...`, 'info');
      addLog(`🏗️ Auth Domain: ${auth.app.options.authDomain}`, 'info');
      
      // Verificar se o usuário atual está logado
      if (!auth.currentUser) {
        addLog('❌ Nenhum usuário logado! Faça login primeiro.', 'error');
        return;
      }
      
      addLog(`👤 Usuário logado: ${auth.currentUser.email}`, 'info');
      addLog(`🆔 UID do admin: ${auth.currentUser.uid}`, 'info');
      
      let userCredential = null;
      
      try {
        // Criar usuário no Firebase Auth
        addLog('🔐 Criando usuário no Firebase Authentication...', 'info');
        addLog('⏳ Aguarde, conectando com o Firebase...', 'info');
        
        userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.senha
        );
        
        addLog(`✅ Usuário criado no Auth com sucesso!`, 'success');
        addLog(`🆔 UID: ${userCredential.user.uid}`, 'success');
        addLog(`📧 Email confirmado: ${userCredential.user.email}`, 'success');
        addLog(`🕐 Data de criação: ${userCredential.user.metadata.creationTime}`, 'info');
        
        // Verificar se realmente foi criado
        addLog('🔍 Verificando se o usuário realmente existe no Firebase...', 'info');
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === userCredential.user.uid) {
          addLog('✅ Confirmado: Usuário existe no Firebase Auth!', 'success');
        } else {
          addLog('⚠️ Algo estranho: Usuário pode não ter sido criado corretamente', 'warning');
        }
        
      } catch (authError) {
        addLog(`❌ Erro no Firebase Auth: ${authError.code}`, 'error');
        addLog(`📝 Mensagem: ${authError.message}`, 'error');
        
        // Erros específicos
        if (authError.code === 'auth/network-request-failed') {
          addLog('🌐 Erro de rede - Verifique sua conexão com a internet', 'error');
        } else if (authError.code === 'auth/email-already-in-use') {
          addLog('📧 Email já está em uso - Tente outro email', 'error');
        } else if (authError.code === 'auth/weak-password') {
          addLog('🔒 Senha muito fraca - Use pelo menos 6 caracteres', 'error');
        } else if (authError.code === 'auth/invalid-email') {
          addLog('📧 Email inválido - Verifique o formato', 'error');
        }
        
        throw authError;
      }
      
      // Aguardar um pouco
      addLog('⏳ Aguardando 2 segundos...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        // Criar documento no Firestore
        addLog('💾 Salvando dados no Firestore...', 'info');
        addLog(`🔗 Tentando salvar no documento: usuarios/${userCredential.user.uid}`, 'info');
        
        const permissions = getPermissionsByProfile(formData.perfil);
        const userData = {
          nome: formData.nome,
          email: formData.email,
          perfil: formData.perfil,
          unidades: formData.unidades,
          permissions: permissions,
          ativo: true,
          criadoEm: new Date(),
          updatedAt: new Date(),
          debugTest: true,
          criadoPorDebug: auth.currentUser?.uid || 'unknown'
        };
        
        addLog(`📄 Dados a serem salvos:`, 'info');
        addLog(JSON.stringify(userData, null, 2), 'info');
        
        // Tentar salvar no Firestore
        await setDoc(doc(db, 'usuarios', userCredential.user.uid), userData);
        
        addLog('✅ Dados salvos no Firestore com sucesso!', 'success');
        addLog(`🔗 Documento ID: ${userCredential.user.uid}`, 'success');
        
        // Verificar se realmente foi salvo
        addLog('🔍 Verificando se os dados foram realmente salvos...', 'info');
        const savedDoc = await getDoc(doc(db, 'usuarios', userCredential.user.uid));
        
        if (savedDoc.exists()) {
          addLog('✅ Confirmado: Dados existem no Firestore!', 'success');
          const savedData = savedDoc.data();
          addLog(`📧 Email salvo: ${savedData.email}`, 'success');
          addLog(`👤 Nome salvo: ${savedData.nome}`, 'success');
        } else {
          addLog('❌ ERRO: Dados não foram encontrados no Firestore!', 'error');
        }
        
        toast.success('Usuário de teste criado com sucesso!');
        
      } catch (firestoreError) {
        addLog(`❌ Erro no Firestore: ${firestoreError.code}`, 'error');
        addLog(`📝 Mensagem: ${firestoreError.message}`, 'error');
        
        if (firestoreError.code === 'permission-denied') {
          addLog('🔒 Erro de permissão - Configure as regras do Firestore', 'error');
          addLog('💡 Vá no Firebase Console > Firestore > Rules', 'warning');
        } else if (firestoreError.code === 'unavailable') {
          addLog('🌐 Firestore indisponível - Tente novamente', 'error');
        }
        
        // Tentar limpar o usuário do Auth
        if (userCredential && userCredential.user) {
          try {
            addLog('🔄 Removendo usuário do Auth devido ao erro...', 'warning');
            await userCredential.user.delete();
            addLog('🗑️ Usuário removido do Auth', 'warning');
          } catch (deleteError) {
            addLog(`❌ Erro ao remover usuário: ${deleteError.message}`, 'error');
          }
        }
        
        throw firestoreError;
      }
      
      // Fazer logout do usuário criado
      addLog('🚪 Fazendo logout do usuário criado...', 'info');
      await auth.signOut();
      addLog('✅ Logout realizado. Você precisará fazer login novamente.', 'success');
      
    } catch (error) {
      addLog(`💥 Erro geral: ${error.message}`, 'error');
      toast.error('Erro ao criar usuário de teste');
    } finally {
      setLoading(false);
    }
  };

  const checkAuthState = () => {
    addLog('🔍 Verificando estado do Firebase Auth...', 'info');
    addLog(`👤 Usuário atual: ${auth.currentUser?.email || 'Nenhum'}`, 'info');
    addLog(`🔐 Auth inicializado: ${auth.app ? 'Sim' : 'Não'}`, 'info');
    addLog(`🏗️ App name: ${auth.app?.name}`, 'info');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Debug - Criação de Usuários</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-semibold mb-4">Dados do Usuário Teste</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Senha</label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({...formData, senha: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Ações de Teste</h3>
            <div className="space-y-3">
              <button
                onClick={testCreateUser}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Criando...' : '🧪 Testar Criação de Usuário'}
              </button>
              
              <button
                onClick={checkAuthState}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                🔍 Verificar Estado do Auth
              </button>
              
              <button
                onClick={clearLogs}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                🗑️ Limpar Logs
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
          <h3 className="text-white font-bold mb-2">Logs de Debug:</h3>
          {logs.length === 0 ? (
            <div className="text-gray-500">Nenhum log ainda...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-blue-400'
              }`}>
                [{log.timestamp}] {log.message}
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">💡 Instruções:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Modifique o email se necessário para evitar conflitos</li>
            <li>2. Clique em "Testar Criação de Usuário"</li>
            <li>3. Observe os logs detalhados</li>
            <li>4. Verifique o Firebase Console (Auth e Firestore)</li>
            <li>5. Se der erro, os logs mostrarão exatamente onde falhou</li>
          </ol>
        </div>
        
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2">⚠️ Problema Conhecido:</h4>
          <div className="text-sm text-red-700 space-y-2">
            <p><strong>Situação:</strong> Quando você cria um usuário, o Firebase automaticamente faz login com esse usuário, deslogando o admin.</p>
            <p><strong>Solução Atual:</strong> O sistema faz logout do usuário recém-criado e avisa que o admin precisa fazer login novamente.</p>
            <p><strong>Resultado:</strong> O usuário SERÁ criado no Firebase Auth e no Firestore, mas você será deslogado.</p>
            <p><strong>Próximo Passo:</strong> Após criar o usuário, faça login novamente como admin para continuar gerenciando.</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2">⚠️ Problema Conhecido:</h4>
          <div className="text-sm text-red-700 space-y-2">
            <p><strong>Situação:</strong> Quando você cria um usuário, o Firebase automaticamente faz login com esse usuário, deslogando o admin.</p>
            <p><strong>Solução Atual:</strong> O sistema faz logout do usuário recém-criado e avisa que o admin precisa fazer login novamente.</p>
            <p><strong>Resultado:</strong> O usuário SERÁ criado no Firebase Auth e no Firestore, mas você será deslogado.</p>
            <p><strong>Próximo Passo:</strong> Após criar o usuário, faça login novamente como admin para continuar gerenciando.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
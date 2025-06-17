import React, { useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function DebugFirebase() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchUid, setSearchUid] = useState('');

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const verificarFirestore = async () => {
    setLoading(true);
    clearLogs();
    
    try {
      addLog('🔍 Verificando coleção "usuarios" no Firestore...', 'info');
      
      // Verificar se o usuário atual tem permissões
      if (!currentUser) {
        addLog('❌ Nenhum usuário logado', 'error');
        return;
      }
      
      addLog(`👤 Usuário logado: ${currentUser.email}`, 'info');
      addLog(`🆔 UID do usuário: ${currentUser.uid}`, 'info');
      
      // Tentar buscar a coleção usuarios
      const usuariosRef = collection(db, 'usuarios');
      addLog('📋 Buscando documentos na coleção "usuarios"...', 'info');
      
      const snapshot = await getDocs(usuariosRef);
      addLog(`📊 Documentos encontrados: ${snapshot.size}`, 'info');
      
      const usuariosList = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        usuariosList.push({
          id: doc.id,
          ...data
        });
        addLog(`📄 Documento ID: ${doc.id}`, 'success');
        addLog(`📧 Email: ${data.email || 'N/A'}`, 'info');
        addLog(`👤 Nome: ${data.nome || 'N/A'}`, 'info');
        addLog(`🏢 Unidades: ${data.unidades ? data.unidades.join(', ') : 'N/A'}`, 'info');
        addLog(`📅 Criado em: ${data.criadoEm ? new Date(data.criadoEm.seconds * 1000).toLocaleString() : 'N/A'}`, 'info');
        addLog('---', 'info');
      });
      
      setUsuarios(usuariosList);
      
      if (usuariosList.length === 0) {
        addLog('⚠️ Nenhum usuário encontrado na coleção', 'warning');
        addLog('💡 Possíveis causas:', 'warning');
        addLog('   - Usuários foram salvos em outra coleção', 'warning');
        addLog('   - Regras do Firestore bloquearam a leitura', 'warning');
        addLog('   - Usuários não foram salvos corretamente', 'warning');
      } else {
        addLog(`✅ Total de usuários encontrados: ${usuariosList.length}`, 'success');
      }
      
    } catch (error) {
      addLog(`❌ Erro ao acessar Firestore: ${error.code}`, 'error');
      addLog(`📝 Mensagem: ${error.message}`, 'error');
      
      if (error.code === 'permission-denied') {
        addLog('🔒 Erro de permissão - Verifique as regras do Firestore', 'error');
        addLog('💡 Solução: Configure as regras para permitir leitura da coleção "usuarios"', 'warning');
      }
    } finally {
      setLoading(false);
    }
  };

  const buscarPorUid = async () => {
    if (!searchUid.trim()) {
      toast.error('Digite um UID para buscar');
      return;
    }
    
    setLoading(true);
    addLog(`🔍 Buscando usuário com UID: ${searchUid}`, 'info');
    
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', searchUid));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        addLog('✅ Usuário encontrado!', 'success');
        addLog(`📧 Email: ${data.email}`, 'success');
        addLog(`👤 Nome: ${data.nome}`, 'success');
        addLog(`🏢 Unidades: ${data.unidades ? data.unidades.join(', ') : 'N/A'}`, 'success');
        addLog(`📅 Criado em: ${data.criadoEm ? new Date(data.criadoEm.seconds * 1000).toLocaleString() : 'N/A'}`, 'success');
      } else {
        addLog('❌ Usuário não encontrado com esse UID', 'error');
        addLog('💡 Verifique se o UID está correto', 'warning');
      }
    } catch (error) {
      addLog(`❌ Erro ao buscar usuário: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const verificarAuth = () => {
    addLog('🔍 Verificando Firebase Authentication...', 'info');
    addLog(`👤 Usuário atual: ${auth.currentUser?.email || 'Nenhum'}`, 'info');
    addLog(`🆔 UID atual: ${auth.currentUser?.uid || 'N/A'}`, 'info');
    addLog(`🔐 Auth inicializado: ${auth.app ? 'Sim' : 'Não'}`, 'info');
    addLog(`🏗️ App name: ${auth.app?.name}`, 'info');
    addLog(`🌐 Project ID: ${auth.app?.options?.projectId}`, 'info');
    
    if (auth.currentUser) {
      addLog(`📧 Email verificado: ${auth.currentUser.emailVerified ? 'Sim' : 'Não'}`, 'info');
      addLog(`🕐 Criado em: ${auth.currentUser.metadata.creationTime}`, 'info');
      addLog(`🔄 Último login: ${auth.currentUser.metadata.lastSignInTime}`, 'info');
    }
  };

  const verificarRegrasFirestore = () => {
    addLog('📋 Verificando configuração do Firestore...', 'info');
    addLog(`🌐 Project ID: ${db.app.options.projectId}`, 'info');
    addLog('💡 Para verificar as regras do Firestore:', 'warning');
    addLog('   1. Acesse o Firebase Console', 'warning');
    addLog('   2. Vá em Firestore Database > Rules', 'warning');
    addLog('   3. Verifique se há regras permitindo leitura da coleção "usuarios"', 'warning');
    addLog('   4. Exemplo de regra: allow read, write: if request.auth != null;', 'warning');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Debug - Firebase Console</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="font-semibold mb-4">Verificações Gerais</h3>
            <div className="space-y-3">
              <button
                onClick={verificarFirestore}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                🔍 Verificar Firestore
              </button>
              
              <button
                onClick={verificarAuth}
                className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                🔐 Verificar Authentication
              </button>
              
              <button
                onClick={verificarRegrasFirestore}
                className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
              >
                📋 Verificar Regras
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Busca por UID</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Digite o UID do usuário"
                value={searchUid}
                onChange={(e) => setSearchUid(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <button
                onClick={buscarPorUid}
                disabled={loading || !searchUid.trim()}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
              >
                🔍 Buscar por UID
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Ações</h3>
            <div className="space-y-3">
              <button
                onClick={clearLogs}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                🗑️ Limpar Logs
              </button>
              
              <a
                href={`https://console.firebase.google.com/project/${db.app.options.projectId}/authentication/users`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-center"
              >
                🌐 Abrir Firebase Console
              </a>
            </div>
          </div>
        </div>
        
        {usuarios.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Usuários Encontrados ({usuarios.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 border text-left">UID</th>
                    <th className="px-4 py-2 border text-left">Nome</th>
                    <th className="px-4 py-2 border text-left">Email</th>
                    <th className="px-4 py-2 border text-left">Perfil</th>
                    <th className="px-4 py-2 border text-left">Unidades</th>
                    <th className="px-4 py-2 border text-left">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border text-xs font-mono">{usuario.id}</td>
                      <td className="px-4 py-2 border">{usuario.nome}</td>
                      <td className="px-4 py-2 border">{usuario.email}</td>
                      <td className="px-4 py-2 border">{usuario.perfil}</td>
                      <td className="px-4 py-2 border">{usuario.unidades?.join(', ') || 'N/A'}</td>
                      <td className="px-4 py-2 border">
                        {usuario.criadoEm ? new Date(usuario.criadoEm.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
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
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">🔍 O que esta página faz:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Verifica se os usuários estão salvos no Firestore</li>
            <li>• Mostra todos os usuários encontrados na coleção "usuarios"</li>
            <li>• Permite buscar usuários específicos por UID</li>
            <li>• Verifica configurações do Firebase Authentication</li>
            <li>• Diagnostica problemas de permissões</li>
            <li>• Fornece link direto para o Firebase Console</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 
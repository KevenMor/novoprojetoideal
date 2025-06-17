import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { getPermissionsByProfile } from './permissions';

export const fixTestUser = async (userId) => {
  try {
    console.log('🔧 Corrigindo usuário teste:', userId);
    
    const userRef = doc(db, 'usuarios', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ Usuário não encontrado');
      return false;
    }
    
    const userData = userDoc.data();
    console.log('📋 Dados atuais do usuário:', userData);
    
    // Corrigir dados do usuário teste
    const updatedData = {
      ...userData,
      perfil: 'operator',
      unidades: ['Aparecidinha'], // Garantir que tem a unidade Aparecidinha
      permissions: getPermissionsByProfile('operator'),
      ativo: true,
      updatedAt: new Date()
    };
    
    await updateDoc(userRef, updatedData);
    
    console.log('✅ Usuário corrigido com sucesso:', updatedData);
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao corrigir usuário:', error);
    return false;
  }
};

export const createTestUser = async (email, userData) => {
  try {
    console.log('👤 Criando usuário teste:', email);
    
    const testUserData = {
      nome: userData.nome || 'Usuário Teste',
      email: email,
      perfil: 'operator',
      unidades: ['Aparecidinha'],
      permissions: getPermissionsByProfile('operator'),
      ativo: true,
      criadoEm: new Date(),
      ...userData
    };
    
    // Aqui você precisaria do UID do usuário do Firebase Auth
    // Este é apenas um exemplo de estrutura
    console.log('📝 Dados do usuário teste:', testUserData);
    
    return testUserData;
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário teste:', error);
    return null;
  }
}; 
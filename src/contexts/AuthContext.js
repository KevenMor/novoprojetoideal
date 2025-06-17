import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getPermissionsByProfile, hasPermission, canAccessMenu } from '../utils/permissions';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function login(email, password) {
    console.log('🔐 Tentando fazer login:', email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    try {
      const userDoc = await getDoc(doc(db, 'usuarios', result.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('👤 Dados do usuário carregados:', { 
          nome: userData.nome, 
          perfil: userData.perfil, 
          ativo: userData.ativo 
        });
        
        if (!userData.ativo) {
          await signOut(auth);
          throw new Error('Usuário inativo. Entre em contato com o administrador.');
        }
        
        // Adicionar permissões baseadas no perfil se não existirem
        const userWithPermissions = {
          ...userData,
          permissions: userData.permissions || getPermissionsByProfile(userData.perfil)
        };
        
        setUserProfile(userWithPermissions);
      } else {
        console.warn('⚠️ Perfil do usuário não encontrado no Firestore');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil do usuário:', error);
      // Não bloquear o login se não conseguir carregar o perfil
    }
    
    return result;
  }

  function logout() {
    console.log('🚪 Fazendo logout...');
    setUserProfile(null);
    return signOut(auth);
  }

  useEffect(() => {
    console.log('🔄 Configurando listener de autenticação...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Estado de autenticação mudou:', user ? user.email : 'não autenticado');
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log('📋 Carregando perfil do usuário:', user.uid);
          const userRef = doc(db, 'usuarios', user.uid);
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('✅ Perfil carregado:', { 
              nome: userData.nome, 
              perfil: userData.perfil, 
              ativo: userData.ativo,
              unidades: userData.unidades 
            });
            
            if (userData.ativo) {
              // Adicionar permissões baseadas no perfil se não existirem
              const userWithPermissions = {
                ...userData,
                permissions: userData.permissions || getPermissionsByProfile(userData.perfil)
              };
              
              setUserProfile(userWithPermissions);
            } else {
              console.warn('⚠️ Usuário inativo, fazendo logout...');
              await signOut(auth);
              setUserProfile(null);
            }
          } else {
            console.log('📝 Perfil não existe, criando perfil padrão...');
            // PERFIL NÃO EXISTE: CRIAR PERFIL PADRÃO
            const perfilPadrao = {
              nome: user.displayName || user.email.split('@')[0],
              email: user.email,
              perfil: 'operator', // Perfil padrão mais restritivo
              ativo: true,
              unidades: [],
              permissions: getPermissionsByProfile('operator'),
              criadoEm: new Date()
            };
            
            try {
              await setDoc(userRef, perfilPadrao);
              console.log('✅ Perfil padrão criado com sucesso');
              setUserProfile(perfilPadrao);
            } catch (createError) {
              console.error('❌ Erro ao criar perfil padrão:', createError);
              setUserProfile(null);
            }
          }
        } catch (error) {
          console.error('❌ Erro ao buscar/criar dados do usuário:', error);
          
          if (error.code === 'permission-denied') {
            console.error('🔒 Erro de permissão - Verifique as regras do Firestore');
          }
          
          setUserProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Funções de verificação de permissões
  const checkPermission = (permission) => {
    return hasPermission(userProfile?.permissions, permission);
  };

  const checkMenuAccess = (menuKey) => {
    return canAccessMenu(userProfile?.permissions, menuKey);
  };

  const value = {
    currentUser,
    userProfile,
    login,
    logout,
    isAdmin: userProfile?.perfil === 'admin',
    unidades: userProfile?.unidades || [],
    permissions: userProfile?.permissions || [],
    hasPermission: checkPermission,
    canAccessMenu: checkMenuAccess
  };

  console.log('🔧 AuthContext value:', { 
    hasCurrentUser: !!currentUser, 
    hasUserProfile: !!userProfile, 
    isAdmin: value.isAdmin,
    permissions: value.permissions?.length || 0,
    loading 
  });

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
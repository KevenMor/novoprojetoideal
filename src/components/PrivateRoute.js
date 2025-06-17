import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children, adminOnly = false }) {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    if (adminOnly && userProfile && userProfile.perfil !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [currentUser, userProfile, adminOnly, navigate]);

  // Se não está autenticado, mostra loading
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se está autenticado mas não tem perfil, mostra mensagem (NÃO loading infinito)
  if (currentUser && !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Perfil de usuário não encontrado.<br />Entre em contato com o administrador.</p>
        </div>
      </div>
    );
  }

  // Admin check
  if (adminOnly && userProfile && userProfile.perfil !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return children;
} 
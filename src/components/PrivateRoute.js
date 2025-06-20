import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
      return;
    }
    if (adminOnly && user && user.perfil !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, loading, adminOnly, navigate]);

  // Se ainda está carregando, mostra loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não está autenticado, mostra loading (vai redirecionar)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Admin check
  if (adminOnly && user.perfil !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Acesso restrito a administradores.</p>
        </div>
      </div>
    );
  }

  return children;
} 
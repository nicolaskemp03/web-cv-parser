import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: '40px', height: '40px', border: '3px solid var(--konexa-green-glow)', 
          borderTopColor: 'var(--konexa-green)', borderRadius: '50%', 
          animation: 'spin 1s linear infinite', margin: '0 auto 20px'
        }}></div>
        <h2>Autenticando...</h2>
        <p style={{ color: 'var(--text-muted)' }}>Validando credenciales con Microsoft</p>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

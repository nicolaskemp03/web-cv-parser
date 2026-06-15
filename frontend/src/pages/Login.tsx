import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

export function Login() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleMicrosoftLogin = () => {
    // Redirect to the backend OAuth2 endpoint
    window.location.href = 'http://localhost:3001/api/auth/microsoft';
  };

  return (
    <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
      
      {/* Decorative background gradients are handled in index.css body */}
      
      <div className="glass-panel animate-fade-in" style={{ padding: '50px', maxWidth: '440px', width: '100%', textAlign: 'center' }}>
        
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            Konexa <span style={{ color: 'var(--konexa-green)' }}>CV Parser</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
            Análisis inteligente de currículums.
          </p>
        </div>

        <button className="btn-microsoft" onClick={handleMicrosoftLogin} style={{ width: '100%' }}>
          <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          Iniciar sesión con Microsoft
        </button>

        <p style={{ marginTop: '30px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Acceso restringido para el equipo de Konexa.
        </p>
      </div>

    </div>
  );
}

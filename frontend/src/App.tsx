import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { AuthCallback } from './pages/AuthCallback';
import './App.css';

function DashboardPlaceholder() {
  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '20px' }}>Bienvenido al Parser</h1>
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ color: 'var(--konexa-green)', marginBottom: '15px' }}>Fase 2 Completada</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          La autenticación y el enrutamiento están funcionando correctamente. 
          Este es un dashboard temporal.
        </p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPlaceholder />} />
            <Route path="candidates" element={<div className="animate-fade-in"><h2>Candidatos (Próximamente)</h2></div>} />
            <Route path="templates" element={<div className="animate-fade-in"><h2>Plantillas PDF (Próximamente)</h2></div>} />
            <Route path="settings" element={<div className="animate-fade-in"><h2>Configuración (Próximamente)</h2></div>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

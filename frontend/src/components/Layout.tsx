import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FileText, Settings, LogOut } from 'lucide-react';

export function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/candidates', label: 'Candidatos', icon: Users },
    { path: '/templates', label: 'Plantillas PDF', icon: FileText },
    { path: '/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ marginBottom: '40px', paddingLeft: '10px' }}>
          <h2 style={{ fontSize: '1.4rem' }}>
            Konexa <span style={{ color: 'var(--konexa-green)' }}>CV</span>
          </h2>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link 
                key={item.path} 
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderRadius: '8px', color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--konexa-green)' : '3px solid transparent',
                  transition: 'all var(--transition-fast)',
                  fontWeight: isActive ? 600 : 400
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-main)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <item.icon size={20} style={{ color: isActive ? 'var(--konexa-green)' : 'inherit' }} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <button 
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', borderRadius: '8px', transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--red-glow)';
              e.currentTarget.style.color = 'var(--red)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <LogOut size={20} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '1rem' }}>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

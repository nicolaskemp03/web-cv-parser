import { useState, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { UploadPanel } from '../components/UploadPanel';
import { CandidatesList } from '../components/CandidatesList';
import { CandidateEditor } from '../components/CandidateEditor';
import { TeamtailorImportModal } from '../components/TeamtailorImportModal';
import { Upload, UserPlus } from 'lucide-react';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: 'var(--red-glow)', border: '1px solid var(--red)', borderRadius: '8px', color: 'var(--red)' }}>
          <h3>Algo salió mal al cargar el editor:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '10px', fontSize: '0.9rem' }}>
            {this.state.error?.toString()}
          </pre>
          <button className="btn-secondary" style={{ marginTop: '15px' }} onClick={() => this.setState({hasError: false})}>Reintentar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [showTTImport, setShowTTImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleEditorClose = () => {
    setEditingId(null);
    setRefreshTrigger(prev => prev + 1); // Refresh list in case data changed
  };

  if (editingId) {
    return (
      <div className="animate-fade-in">
        <h2>Editor de Candidato</h2>
        <ErrorBoundary>
          <CandidateEditor id={editingId} onClose={handleEditorClose} />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '20px' }}>Dashboard de Procesamiento</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setShowTTImport(true)} 
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <UserPlus size={20} />
          Importar de Teamtailor
        </button>
        <button 
          onClick={() => setShowUpload(!showUpload)} 
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Upload size={20} />
          Subir CV
        </button>
      </div>

      {showUpload && <UploadPanel onUploadSuccess={handleUploadSuccess} />}
      
      {showTTImport && (
        <TeamtailorImportModal 
          onClose={() => setShowTTImport(false)} 
          onSuccess={() => {
            setShowTTImport(false);
            setRefreshTrigger(prev => prev + 1);
          }} 
        />
      )}
      
      <CandidatesList refreshTrigger={refreshTrigger} onEdit={handleEdit} />
    </div>
  );
}

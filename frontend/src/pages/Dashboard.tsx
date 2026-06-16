import { useState } from 'react';
import { UploadPanel } from '../components/UploadPanel';
import { CandidatesList } from '../components/CandidatesList';
import { CandidateEditor } from '../components/CandidateEditor';

export function Dashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
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
        <CandidateEditor id={editingId} onClose={handleEditorClose} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: '20px' }}>Dashboard de Procesamiento</h1>
      
      <UploadPanel onUploadSuccess={handleUploadSuccess} />
      
      <CandidatesList refreshTrigger={refreshTrigger} onEdit={handleEdit} />
    </div>
  );
}

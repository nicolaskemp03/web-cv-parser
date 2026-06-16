import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Download, Edit2, Trash2, Search, Loader2 } from 'lucide-react';
import api from '../api/api';

export interface Candidate {
  id: string;
  nombres: string;
  apellidos: string;
  rut: string;
  profesion: string;
  created_at: string;
}

export function CandidatesList({ refreshTrigger, onEdit }: { refreshTrigger: number, onEdit: (id: string) => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidates');
      setCandidates(res.data);
    } catch (e) {
      console.error('Failed to fetch candidates', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este candidato?')) return;
    try {
      await api.delete(`/candidates/${id}`);
      setCandidates(candidates.filter(c => c.id !== id));
    } catch (e) {
      console.error('Failed to delete', e);
      alert('Error al eliminar');
    }
  };

  const handleDownloadPdf = async (id: string, name: string) => {
    try {
      const response = await api.post(`/candidates/${id}/download-pdf`, {}, {
        responseType: 'blob', // Important to handle binary PDF stream
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name.replace(/\s+/g, '_')}_CV.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      console.error('Failed to download PDF', e);
      alert('Error al generar PDF');
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const term = searchTerm.toLowerCase();
    return (c.nombres?.toLowerCase() || '').includes(term) || 
           (c.apellidos?.toLowerCase() || '').includes(term) || 
           (c.profesion?.toLowerCase() || '').includes(term);
  });

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--text-light)', margin: 0 }}>Base de Candidatos</h3>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 15px 8px 35px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-color)',
              color: 'var(--text-light)',
              width: '250px',
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--konexa-blue)' }} />
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No hay candidatos registrados aún.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <th style={{ padding: '12px 15px' }}>Nombre</th>
                <th style={{ padding: '12px 15px' }}>Cargo</th>
                <th style={{ padding: '12px 15px' }}>RUT</th>
                <th style={{ padding: '12px 15px' }}>Fecha Análisis</th>
                <th style={{ padding: '12px 15px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s', cursor: 'default' }}>
                  <td style={{ padding: '15px' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-light)' }}>{c.nombres} {c.apellidos}</div>
                  </td>
                  <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{c.profesion || '—'}</td>
                  <td style={{ padding: '15px', color: 'var(--text-muted)' }}>{c.rut || '—'}</td>
                  <td style={{ padding: '15px', color: 'var(--text-muted)' }}>
                    {format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleDownloadPdf(c.id, `${c.nombres} ${c.apellidos}`)}
                        className="btn" 
                        style={{ padding: '6px 10px', backgroundColor: 'var(--konexa-blue)', border: 'none', color: 'var(--bg-color)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Descargar PDF"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={() => onEdit(c.id)}
                        className="btn" 
                        style={{ padding: '6px 10px', backgroundColor: 'transparent', border: '1px solid var(--konexa-green)', color: 'var(--konexa-green)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Editar Datos"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="btn" 
                        style={{ padding: '6px 10px', backgroundColor: 'transparent', border: '1px solid var(--konexa-accent)', color: 'var(--konexa-accent)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

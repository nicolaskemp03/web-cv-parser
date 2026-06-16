import { useState, useEffect } from 'react';
import { Search, Download, Loader2, X, User as UserIcon } from 'lucide-react';
import api from '../api/api';

export function TeamtailorImportModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length > 2) {
        handleSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async (q: string) => {
    setSearching(true);
    setError(null);
    try {
      const res = await api.get(`/teamtailor/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch (e) {
      console.error(e);
      setError('Error al buscar candidatos en Teamtailor.');
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (id: string) => {
    setImportingId(id);
    setError(null);
    try {
      await api.post(`/teamtailor/import/${id}`);
      onSuccess();
    } catch (e: any) {
      console.error(e);
      setError(e.response?.data?.message || 'Error al importar y procesar el candidato.');
      setImportingId(null);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '600px', maxWidth: '90%', padding: '30px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        <h2 style={{ marginBottom: '5px' }}>Importar desde Teamtailor</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '25px', fontSize: '0.95rem' }}>
          Busca un candidato por nombre, apellido o ID de Teamtailor. Descargaremos su CV original y usaremos la IA para parsearlo.
        </p>

        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Ej. correo@ejemplo.com, ID 123456, ó Juan Zambrano"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ paddingLeft: '45px', fontSize: '1.05rem', padding: '12px 15px 12px 45px' }}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 15px', backgroundColor: 'var(--red-glow)', border: '1px solid var(--red)', borderRadius: '8px', color: 'var(--red)', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ minHeight: '200px', maxHeight: '400px', overflowY: 'auto' }}>
          {searching && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--konexa-blue)' }} />
            </div>
          )}
          
          {!searching && query.length > 2 && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              No se encontraron candidatos.
            </div>
          )}

          {!searching && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {c.picture ? (
                      <img src={c.picture} alt={c.nombres} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <UserIcon size={20} />
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{c.nombres} {c.apellidos}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.titulo || 'Sin cargo'} • ID: {c.id}</div>
                    </div>
                  </div>
                  
                  <button 
                    className="btn-primary" 
                    onClick={() => handleImport(c.id)}
                    disabled={importingId !== null}
                    style={{ padding: '8px 15px', fontSize: '0.9rem' }}
                  >
                    {importingId === c.id ? (
                      <><Loader2 className="animate-spin" size={16} /> Importando...</>
                    ) : (
                      <><Download size={16} /> Extraer CV</>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

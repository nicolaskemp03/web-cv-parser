import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Download, Loader2 } from 'lucide-react';
import api from '../api/api';

export function CandidateEditor({ id, onClose }: { id: string, onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await api.get(`/candidates/${id}`);
        setData(res.data);
      } catch (e) {
        console.error(e);
        alert('Error loading candidate data');
        onClose();
      } finally {
        setLoading(false);
      }
    };
    fetchCandidate();
  }, [id, onClose]);

  const handleChange = (field: string, value: any) => {
    setData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (arrayName: string, index: number, field: string, value: any) => {
    setData((prev: any) => {
      const newArray = [...prev[arrayName]];
      newArray[index] = { ...newArray[index], [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleAddArrayItem = (arrayName: string, emptyItem: any) => {
    setData((prev: any) => ({
      ...prev,
      [arrayName]: [...(prev[arrayName] || []), emptyItem]
    }));
  };

  const handleRemoveArrayItem = (arrayName: string, index: number) => {
    setData((prev: any) => {
      const newArray = [...prev[arrayName]];
      newArray.splice(index, 1);
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/candidates/${id}`, data);
      alert('Datos guardados exitosamente');
    } catch (e) {
      console.error(e);
      alert('Error al guardar datos');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await api.post(`/candidates/${id}/download-pdf`, {}, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${data.nombres}_${data.apellidos}_CV.pdf`.replace(/\s+/g, '_'));
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      console.error(e);
      alert('Error al generar PDF');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
      <Loader2 className="animate-spin" size={32} style={{ color: 'var(--konexa-blue)' }} />
    </div>;
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button className="btn" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px' }}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn" onClick={handleDownloadPdf} style={{ backgroundColor: 'var(--konexa-blue)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px' }}>
            <Download size={18} /> Previsualizar PDF
          </button>
          <button className="btn" onClick={handleSave} disabled={saving} style={{ backgroundColor: 'var(--konexa-green)', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px' }}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar Cambios
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Información Personal</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Nombres" value={data.nombres || ''} onChange={(e) => handleChange('nombres', e.target.value)} className="form-input" />
            <input type="text" placeholder="Apellidos" value={data.apellidos || ''} onChange={(e) => handleChange('apellidos', e.target.value)} className="form-input" />
            <input type="text" placeholder="Cargo / Profesión" value={data.profesion || ''} onChange={(e) => handleChange('profesion', e.target.value)} className="form-input" />
            <input type="text" placeholder="RUT" value={data.rut || ''} onChange={(e) => handleChange('rut', e.target.value)} className="form-input" />
            <input type="email" placeholder="Correo" value={data.mail || ''} onChange={(e) => handleChange('mail', e.target.value)} className="form-input" />
            <input type="text" placeholder="Teléfono" value={data.numero || ''} onChange={(e) => handleChange('numero', e.target.value)} className="form-input" />
            <input type="text" placeholder="Ubicación" value={data.ubicacion || ''} onChange={(e) => handleChange('ubicacion', e.target.value)} className="form-input" />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Resumen Profesional</h3>
          <textarea 
            placeholder="Resumen HTML soportado (e.g. <strong>Hola</strong>)" 
            value={data.resumen || ''} 
            onChange={(e) => handleChange('resumen', e.target.value)} 
            className="form-input"
            style={{ height: 'calc(100% - 40px)', resize: 'vertical', minHeight: '150px' }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Experiencia Laboral</h3>
          <button className="btn" onClick={() => handleAddArrayItem('experiences', { empresa: '', puesto: '', inicio: '', termino: '', descripcion: '', orden: data.experiences?.length || 0 })} style={{ padding: '5px 10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={16} /> Añadir
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {(data.experiences || []).map((exp: any, idx: number) => (
            <div key={idx} style={{ padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '4px solid var(--konexa-green)', position: 'relative' }}>
              <button onClick={() => handleRemoveArrayItem('experiences', idx)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--konexa-accent)', cursor: 'pointer' }}><Trash2 size={18} /></button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px', paddingRight: '30px' }}>
                <input type="text" placeholder="Empresa" value={exp.empresa || ''} onChange={(e) => handleArrayChange('experiences', idx, 'empresa', e.target.value)} className="form-input" />
                <input type="text" placeholder="Cargo" value={exp.puesto || ''} onChange={(e) => handleArrayChange('experiences', idx, 'puesto', e.target.value)} className="form-input" />
                <input type="text" placeholder="Inicio (e.g. Ene 2020)" value={exp.inicio || ''} onChange={(e) => handleArrayChange('experiences', idx, 'inicio', e.target.value)} className="form-input" />
                <input type="text" placeholder="Término (e.g. Presente)" value={exp.termino || ''} onChange={(e) => handleArrayChange('experiences', idx, 'termino', e.target.value)} className="form-input" />
              </div>
              <textarea placeholder="Descripción del cargo" value={exp.descripcion || ''} onChange={(e) => handleArrayChange('experiences', idx, 'descripcion', e.target.value)} className="form-input" style={{ minHeight: '80px' }} />
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Educación</h3>
          <button className="btn" onClick={() => handleAddArrayItem('education', { institucion: '', titulo: '', anio: '', orden: data.education?.length || 0 })} style={{ padding: '5px 10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={16} /> Añadir
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {(data.education || []).map((edu: any, idx: number) => (
            <div key={idx} style={{ padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '4px solid var(--konexa-blue)', position: 'relative' }}>
              <button onClick={() => handleRemoveArrayItem('education', idx)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--konexa-accent)', cursor: 'pointer' }}><Trash2 size={18} /></button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', paddingRight: '30px' }}>
                <input type="text" placeholder="Institución" value={edu.institucion || ''} onChange={(e) => handleArrayChange('education', idx, 'institucion', e.target.value)} className="form-input" />
                <input type="text" placeholder="Título" value={edu.titulo || ''} onChange={(e) => handleArrayChange('education', idx, 'titulo', e.target.value)} className="form-input" />
                <input type="text" placeholder="Año" value={edu.anio || ''} onChange={(e) => handleArrayChange('education', idx, 'anio', e.target.value)} className="form-input" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

import { useEffect, useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Download, Loader2, GripVertical, X } from 'lucide-react';
import api from '../api/api';
// @ts-ignore
import RQ from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const RQAny: any = RQ;
const ReactQuill = typeof RQAny === 'function' ? RQAny : RQAny.default ? RQAny.default : RQAny;

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'bullet' }],
    ['clean']
  ],
};

function SortableExperienceItem({ id, exp, index, onRemove, onChange }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={{ ...style, padding: '15px', marginBottom: '15px', position: 'relative', borderLeft: '4px solid var(--konexa-green)' }} className="glass-panel">
      <div 
        {...attributes} 
        {...listeners} 
        style={{ position: 'absolute', left: '-15px', top: '50%', transform: 'translateY(-50%)', cursor: 'grab', color: 'var(--text-muted)' }}
      >
        <GripVertical size={20} />
      </div>
      
      <button onClick={() => onRemove(index)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--konexa-accent)', cursor: 'pointer' }}>
        <Trash2 size={18} />
      </button>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px', paddingRight: '30px' }}>
        <input type="text" placeholder="Empresa" value={exp.empresa || ''} onChange={(e) => onChange(index, 'empresa', e.target.value)} className="input-field" />
        <input type="text" placeholder="Cargo" value={exp.puesto || ''} onChange={(e) => onChange(index, 'puesto', e.target.value)} className="input-field" />
        <input type="text" placeholder="Inicio (e.g. Ene 2020)" value={exp.inicio || ''} onChange={(e) => onChange(index, 'inicio', e.target.value)} className="input-field" />
        <input type="text" placeholder="Término (e.g. Presente)" value={exp.termino || ''} onChange={(e) => onChange(index, 'termino', e.target.value)} className="input-field" />
      </div>
      <ReactQuill theme="snow" value={exp.descripcion || ''} onChange={(val: string) => onChange(index, 'descripcion', val)} modules={quillModules} />
    </div>
  );
}

export function CandidateEditor({ id, onClose }: { id: string, onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStackItem, setNewStackItem] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await api.get(`/candidates/${id}`);
        // Ensure every experience has an ID for dnd-kit
        const expData = (res.data.experiences || []).map((exp: any, i: number) => ({ ...exp, _dndId: exp.id || `exp-${i}-${Date.now()}` }));
        setData({ ...res.data, experiences: expData });
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
      [arrayName]: [...(prev[arrayName] || []), { ...emptyItem, _dndId: `${arrayName}-${Date.now()}` }]
    }));
  };

  const handleRemoveArrayItem = (arrayName: string, index: number) => {
    setData((prev: any) => {
      const newArray = [...prev[arrayName]];
      newArray.splice(index, 1);
      return { ...prev, [arrayName]: newArray };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setData((prev: any) => {
        const oldIndex = prev.experiences.findIndex((exp: any) => exp._dndId === active.id);
        const newIndex = prev.experiences.findIndex((exp: any) => exp._dndId === over?.id);
        
        const newExperiences = arrayMove(prev.experiences, oldIndex, newIndex);
        // Update sorting order
        newExperiences.forEach((exp: any, idx: number) => exp.orden = idx);
        
        return { ...prev, experiences: newExperiences };
      });
    }
  };

  const handleAddStack = () => {
    if (newStackItem.trim()) {
      setData((prev: any) => ({
        ...prev,
        stack: [...(prev.stack || []), newStackItem.trim()]
      }));
      setNewStackItem('');
    }
  };

  const handleRemoveStack = (index: number) => {
    setData((prev: any) => {
      const newStack = [...prev.stack];
      newStack.splice(index, 1);
      return { ...prev, stack: newStack };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Remove temporary _dndId before saving
      const payload = { ...data };
      payload.experiences = payload.experiences.map((exp: any) => {
        const { _dndId, ...rest } = exp;
        return rest;
      });
      await api.put(`/candidates/${id}`, payload);
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
        <button className="btn-secondary" onClick={onClose} style={{ border: 'none' }}>
          <ArrowLeft size={18} /> Volver
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={handleDownloadPdf}>
            <Download size={18} /> PDF
          </button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Información Personal</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Nombres" value={data.nombres || ''} onChange={(e) => handleChange('nombres', e.target.value)} className="input-field" />
            <input type="text" placeholder="Apellidos" value={data.apellidos || ''} onChange={(e) => handleChange('apellidos', e.target.value)} className="input-field" />
            <input type="text" placeholder="Cargo / Profesión" value={data.profesion || ''} onChange={(e) => handleChange('profesion', e.target.value)} className="input-field" />
            <input type="text" placeholder="RUT" value={data.rut || ''} onChange={(e) => handleChange('rut', e.target.value)} className="input-field" />
            <input type="email" placeholder="Correo" value={data.mail || ''} onChange={(e) => handleChange('mail', e.target.value)} className="input-field" />
            <input type="text" placeholder="Teléfono" value={data.numero || ''} onChange={(e) => handleChange('numero', e.target.value)} className="input-field" />
            <input type="text" placeholder="Ubicación" value={data.ubicacion || ''} onChange={(e) => handleChange('ubicacion', e.target.value)} className="input-field" />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '15px' }}>Resumen Profesional</h3>
          <div style={{ flex: 1 }}>
            <ReactQuill theme="snow" value={data.resumen || ''} onChange={(val: string) => handleChange('resumen', val)} modules={quillModules} style={{ height: 'calc(100% - 42px)' }} />
          </div>
        </div>
      </div>
      
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Stack Tecnológico</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
          {(data.stack || []).map((tech: string, idx: number) => (
            <div key={idx} style={{ padding: '5px 10px', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              {tech}
              <X size={14} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleRemoveStack(idx)} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Añadir tecnología (e.g. React)" 
            value={newStackItem} 
            onChange={(e) => setNewStackItem(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && handleAddStack()}
            className="input-field" 
            style={{ width: '250px' }}
          />
          <button className="btn-secondary" onClick={handleAddStack}><Plus size={18} /></button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Experiencia Laboral</h3>
          <button className="btn-secondary" onClick={() => handleAddArrayItem('experiences', { empresa: '', puesto: '', inicio: '', termino: '', descripcion: '', orden: data.experiences?.length || 0 })}>
            <Plus size={16} /> Añadir
          </button>
        </div>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={(data.experiences || []).map((e: any) => e._dndId)} strategy={verticalListSortingStrategy}>
            {(data.experiences || []).map((exp: any, idx: number) => (
              <SortableExperienceItem 
                key={exp._dndId} 
                id={exp._dndId} 
                exp={exp} 
                index={idx} 
                onRemove={handleRemoveArrayItem} 
                onChange={handleArrayChange} 
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>Educación</h3>
          <button className="btn-secondary" onClick={() => handleAddArrayItem('education', { institucion: '', titulo: '', anio: '', orden: data.education?.length || 0 })}>
            <Plus size={16} /> Añadir
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {(data.education || []).map((edu: any, idx: number) => (
            <div key={idx} style={{ padding: '15px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '4px solid var(--konexa-blue)', position: 'relative' }}>
              <button onClick={() => handleRemoveArrayItem('education', idx)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--konexa-accent)', cursor: 'pointer' }}><Trash2 size={18} /></button>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', paddingRight: '30px' }}>
                <input type="text" placeholder="Institución" value={edu.institucion || ''} onChange={(e) => handleArrayChange('education', idx, 'institucion', e.target.value)} className="input-field" />
                <input type="text" placeholder="Título" value={edu.titulo || ''} onChange={(e) => handleArrayChange('education', idx, 'titulo', e.target.value)} className="input-field" />
                <input type="text" placeholder="Año" value={edu.anio || ''} onChange={(e) => handleArrayChange('education', idx, 'anio', e.target.value)} className="input-field" />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

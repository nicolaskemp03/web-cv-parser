import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/api';

interface UploadStatus {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
}

export function UploadPanel({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newUploads = acceptedFiles.map((file) => ({
      file,
      progress: 0,
      status: 'pending' as const,
    }));
    
    setUploads((prev) => [...prev, ...newUploads]);

    for (const upload of newUploads) {
      const formData = new FormData();
      formData.append('file', upload.file);

      setUploads((prev) =>
        prev.map((u) => (u.file === upload.file ? { ...u, status: 'uploading', progress: 10 } : u))
      );

      try {
        await api.post('/parser/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            // Keep it at 90% while the backend processes OpenAI
            const simulatedProgress = Math.min(percentCompleted, 90);
            setUploads((prev) =>
              prev.map((u) => (u.file === upload.file ? { ...u, progress: simulatedProgress } : u))
            );
          },
        });

        setUploads((prev) =>
          prev.map((u) => (u.file === upload.file ? { ...u, status: 'success', progress: 100 } : u))
        );
        onUploadSuccess();
      } catch (error: any) {
        setUploads((prev) =>
          prev.map((u) => (
            u.file === upload.file
              ? { ...u, status: 'error', message: error.response?.data?.message || 'Error al procesar' }
              : u
          ))
        );
      }
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
  });

  return (
    <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
      <h3 style={{ marginBottom: '15px', color: 'var(--text-light)' }}>Importar CVs</h3>
      
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--konexa-green)' : 'var(--border-color)'}`,
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'rgba(71, 255, 150, 0.05)' : 'rgba(255, 255, 255, 0.02)',
          transition: 'all 0.3s ease',
        }}
      >
        <input {...getInputProps()} />
        <UploadCloud size={48} style={{ color: 'var(--konexa-green)', margin: '0 auto 15px auto' }} />
        <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', marginBottom: '5px' }}>
          {isDragActive ? 'Suelta los archivos aquí...' : 'Arrastra PDFs o DOCXs aquí, o haz clic para seleccionar'}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Soporta arrastrar múltiples archivos a la vez
        </p>
      </div>

      {uploads.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {uploads.map((upload, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 15px', 
              backgroundColor: 'rgba(0,0,0,0.2)', 
              borderRadius: '8px',
              borderLeft: `4px solid ${
                upload.status === 'success' ? 'var(--konexa-green)' : 
                upload.status === 'error' ? 'var(--konexa-accent)' : 'var(--konexa-blue)'
              }`
            }}>
              <File size={20} style={{ color: 'var(--text-muted)', marginRight: '15px' }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {upload.file.name}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {upload.status === 'error' ? upload.message : `${upload.progress}%`}
                  </span>
                </div>
                {upload.status !== 'error' && upload.status !== 'success' && (
                  <div style={{ height: '4px', backgroundColor: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${upload.progress}%`, 
                      backgroundColor: 'var(--konexa-blue)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                )}
              </div>
              <div style={{ marginLeft: '15px' }}>
                {upload.status === 'uploading' && <Loader2 size={20} className="animate-spin" style={{ color: 'var(--konexa-blue)' }} />}
                {upload.status === 'success' && <CheckCircle size={20} style={{ color: 'var(--konexa-green)' }} />}
                {upload.status === 'error' && <AlertCircle size={20} style={{ color: 'var(--konexa-accent)' }} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

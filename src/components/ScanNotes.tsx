// ============================================================
// ScanNotes.tsx — Sección "Escanear apuntes"
// OCR real en el navegador (Tesseract.js) + análisis local.
// Sin API key, sin servidor, gratis.
// ============================================================
import { useState, useRef, useEffect } from 'react';
import { useStudy } from '../store/StudyContext';
import { useAuth } from '../store/AuthContext';
import type { ScannedNote } from '../store/types';
import { analyzeText } from '../lib/study';
import { checkQuota, describeQuota, recordUpload } from '../lib/quota';
import type { QuotaStatus } from '../lib/quota';
// OCR se importa dinámicamente para no inflar el bundle inicial (~500KB).

// Estado posible de la sección
type UploadState = 'idle' | 'loading' | 'done' | 'error';

export default function ScanNotes() {
  const { notes, addNote, updateNote, clearNotes } = useStudy();
  const { user, isPremium, openAuth, openUpgrade } = useAuth();
  const [enhancing, setEnhancing] = useState(false);
  // Estado de la subida: idle (espera), loading (cargando), done (listo)
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  // Nombre del archivo subido
  const [fileName, setFileName] = useState('');
  // Nota actualmente visible (la recién procesada o una del historial)
  const [currentNote, setCurrentNote] = useState<ScannedNote | null>(null);
  // Para arrastrar archivos
  const [isDragging, setIsDragging] = useState(false);
  // Referencia al input de archivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [quota, setQuota] = useState<QuotaStatus>(() => checkQuota(user));

  // La cuota cambia al iniciar sesión, cerrar sesión o activar Pro
  useEffect(() => {
    setQuota(checkQuota(user));
  }, [user]);

  function handleQuotaBlocked() {
    if (!user) openAuth('register');
    else openUpgrade();
  }

  // Procesa el archivo con OCR real y lo guarda en el store.
  async function processFile(file: File) {
    // Validación básica: 10MB máx, solo imagen o PDF
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      setErrorMsg('Formato no soportado. Sube una imagen (JPG, PNG) o un PDF.');
      setUploadState('error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Archivo muy grande. Máximo 10MB.');
      setUploadState('error');
      return;
    }
    // Cuota de la demo / cuenta / plan
    const current = checkQuota(user);
    setQuota(current);
    if (!current.allowed) {
      handleQuotaBlocked();
      return;
    }
    setFileName(file.name);
    setErrorMsg('');
    setUploadState('loading');
    setStatusMsg(isPdf ? 'Extrayendo texto del PDF…' : 'Cargando motor OCR… (primera vez tarda ~10s)');
    try {
      const { extractTextFromFile } = await import('../lib/ocr');
      const { text, method } = await extractTextFromFile(file, (p) => {
        if (p.status.includes('recogniz')) {
          setStatusMsg(`Leyendo texto… ${Math.round(p.progress * 100)}%`);
        }
      });
      setStatusMsg('Organizando el contenido…');
      const analysis = analyzeText(text, file.name);
      const { buildLocalDeck, generateDeck, hasGroqKey } = await import('../lib/ai');
      const localDeck = buildLocalDeck(analysis);
      const note = addNote({
        fileName: file.name,
        subject: analysis.subject,
        summary: analysis.summary,
        keywords: analysis.keywords,
        rawText: text.slice(0, 5000),
        method,
        aiEnhanced: false,
        flashcards: localDeck.flashcards,
        quiz: localDeck.quiz,
      });
      setCurrentNote(note);
      setUploadState('done');
      // Consume 1 de la cuota y actualiza el contador visible
      setQuota(recordUpload(user));
      // Si hay key de Groq, mejora con IA real en segundo plano
      if (hasGroqKey()) {
        setEnhancing(true);
        try {
          const deck = await generateDeck(text, analysis);
          updateNote(note.id, {
            subject: deck.subject,
            summary: deck.summary,
            keywords: deck.keywords,
            flashcards: deck.flashcards,
            quiz: deck.quiz,
            aiEnhanced: deck.aiEnhanced,
          });
          setCurrentNote((prev) =>
            prev && prev.id === note.id
              ? { ...prev, ...deck }
              : prev,
          );
        } finally {
          setEnhancing(false);
        }
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'No pude procesar el archivo.');
      setUploadState('error');
    }
  }

  // Maneja la selección de archivo desde el input
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  // Maneja el arrastre de archivo sobre la zona
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  // Reinicia para subir otro archivo
  function handleReset() {
    setUploadState('idle');
    setFileName('');
    setCurrentNote(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // Ver una nota del historial
  function viewNote(note: ScannedNote) {
    setCurrentNote(note);
    setFileName(note.fileName);
    setUploadState('done');
  }

  return (
    <section id="escanear" className="section" style={{ paddingTop: '7rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Encabezado de sección */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{
            display: 'inline-block',
            background: '#EDE9FF',
            color: '#7C6CE6',
            fontFamily: 'Nunito, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
            padding: '0.35rem 1rem',
            borderRadius: '999px',
            marginBottom: '1rem',
          }}>
            📸 Escanear apuntes
          </span>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontFamily: 'Nunito, sans-serif', color: '#2C2855', marginBottom: '0.75rem' }}>
            Sube tus apuntes
          </h2>
          <p style={{ color: '#7C75A6', fontSize: '1rem', maxWidth: '480px', margin: '0 auto' }}>
            Acepta imágenes (JPG, PNG) o archivos PDF. StudySnap organizará todo el contenido por ti.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '0.75rem' }}>
            <p style={{
              display: 'inline-block',
              background: quota.unlimited ? '#ECFDF5' : quota.allowed ? '#EDE9FF' : '#fee2e2',
              color: quota.unlimited ? '#047857' : quota.allowed ? '#7C6CE6' : '#991b1b',
              fontFamily: 'Nunito, sans-serif', fontWeight: 700, fontSize: '0.8rem',
              padding: '0.3rem 0.875rem', borderRadius: '999px', margin: 0,
            }}>
              {describeQuota(quota)}
            </p>
            {!isPremium && (
              <button
                type="button"
                onClick={() => (user ? openUpgrade() : openAuth('register'))}
                style={{
                  background: 'white', border: '1px solid #DDD6FE', color: '#7C6CE6',
                  fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '0.8rem',
                  padding: '0.3rem 0.875rem', borderRadius: '999px', cursor: 'pointer',
                }}
              >
                {user ? '⚡ Hazte Pro' : 'Crear cuenta'}
              </button>
            )}
          </div>
        </div>

        {/* Estado: Esperando archivo (idle) */}
        {uploadState === 'idle' && (
          <div
            className={`drop-zone ${isDragging ? 'drag-over' : ''}`}
            style={{ padding: '3.5rem 2rem', textAlign: 'center', cursor: 'pointer', opacity: quota.allowed ? 1 : 0.65 }}
            onClick={() => {
              if (!quota.allowed) {
                handleQuotaBlocked();
                return;
              }
              fileInputRef.current?.click();
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            {/* Ícono de subida */}
            <div style={{
              fontSize: '3.5rem',
              background: '#EDE9FF',
              width: '96px',
              height: '96px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}>
              📸
            </div>

            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#2C2855', marginBottom: '0.5rem' }}>
              Arrastra tu foto aquí
            </h3>
            <p style={{ color: '#7C75A6', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              o haz clic para seleccionar un archivo
            </p>

            {/* Tipos de archivo aceptados */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {['JPG', 'PNG', 'PDF', 'HEIC'].map(type => (
                <span key={type} style={{
                  background: '#EDE9FF',
                  color: '#7C6CE6',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  fontFamily: 'Nunito, sans-serif',
                }}>
                  .{type}
                </span>
              ))}
            </div>

            {/* Input de archivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* Estado: Procesando (loading) */}
        {uploadState === 'loading' && (
          <div className="card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            {/* Animación de carga */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              border: '4px solid #EDE9FF',
              borderTop: '4px solid #7C6CE6',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1.5rem',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, fontSize: '1.2rem', color: '#2C2855', marginBottom: '0.5rem' }}>
              Analizando tus apuntes...
            </h3>
            <p style={{ color: '#7C75A6', fontSize: '0.9rem' }}>
              {statusMsg || `Organizando el contenido de ${fileName}`}
            </p>
            <p style={{ color: '#7C75A6', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {fileName} · OCR local, tus fotos no salen de tu dispositivo
            </p>

            {/* Barra de progreso animada */}
            <div className="progress-bar" style={{ maxWidth: '300px', margin: '1.5rem auto 0' }}>
              <div className="progress-fill" style={{ width: '70%', animation: 'grow 2s ease-out' }}/>
            </div>
            <style>{`@keyframes grow { from { width: 0%; } to { width: 70%; } }`}</style>
          </div>
        )}

        {/* Estado: Error */}
        {uploadState === 'error' && (
          <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center', borderColor: '#f87171' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>😕</div>
            <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', marginBottom: '0.5rem' }}>
              No pude leerlo
            </h3>
            <p style={{ color: '#7C75A6', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{errorMsg}</p>
            <button onClick={handleReset} className="btn-primary">Intentar con otro archivo</button>
          </div>
        )}

        {/* Estado: Resultado listo (done) */}
        {uploadState === 'done' && currentNote && (
          <div>
            {/* Cabecera del resultado */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <div>
                  <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855', marginBottom: '0.1rem' }}>
                    ¡Apuntes organizados!
                  </h3>
                  <p style={{ color: '#7C75A6', fontSize: '0.85rem' }}>{currentNote.subject} · {currentNote.fileName}</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    {enhancing ? (
                      <span style={{ color: '#7C6CE6' }}>✨ Mejorando con IA (Groq)…</span>
                    ) : currentNote.aiEnhanced ? (
                      <span style={{ color: '#059669' }}>✨ Mejorado con IA · flashcards y quiz listos en Estudiar</span>
                    ) : (
                      <span style={{ color: '#7C75A6' }}>Análisis local · pon tu key de Groq en .env para IA completa</span>
                    )}
                  </p>
                </div>
              </div>
              <button onClick={handleReset} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}>
                Subir otro
              </button>
            </div>

            {/* Palabras clave detectadas */}
            <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
              <p style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#2C2855', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                🏷️ Conceptos clave identificados
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {currentNote.keywords.map(kw => (
                  <span key={kw} style={{
                    background: '#EDE9FF',
                    color: '#7C6CE6',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '0.3rem 0.875rem',
                    borderRadius: '999px',
                    fontFamily: 'Nunito, sans-serif',
                  }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Resumen por secciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {currentNote.summary.map((item, i) => (
                <div key={i} className="card" style={{ padding: '1.25rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {/* Número del concepto */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #7C6CE6, #a78bfa)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#2C2855', marginBottom: '0.25rem' }}>
                      {item.title}
                    </h4>
                    <p style={{ color: '#7C75A6', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {item.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Texto OCR original + origen */}
            {currentNote.rawText && (
              <details className="card" style={{ padding: '1.25rem 1.5rem', marginTop: '1.25rem' }}>
                <summary style={{ cursor: 'pointer', fontFamily: 'Nunito, sans-serif', fontWeight: 700, color: '#2C2855', fontSize: '0.9rem' }}>
                  📝 Ver texto extraído {currentNote.method === 'ocr' ? '(OCR)' : currentNote.method === 'pdf-text' ? '(PDF)' : ''}
                </summary>
                <p style={{ color: '#7C75A6', fontSize: '0.85rem', marginTop: '0.75rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {currentNote.rawText.slice(0, 2000)}
                </p>
              </details>
            )}
          </div>
        )}

        {/* Historial guardado en este navegador */}
        {uploadState !== 'loading' && notes.length > 0 && (
          <div className="card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'Nunito, sans-serif', fontWeight: 800, color: '#2C2855' }}>
                📚 Mis apuntes guardados ({notes.length})
              </h3>
              <button
                onClick={clearNotes}
                style={{ background: 'none', border: 'none', color: '#7C75A6', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Borrar todo
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => viewNote(n)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.75rem 1rem', borderRadius: '0.75rem',
                    border: currentNote?.id === n.id ? '2px solid #7C6CE6' : '1px solid #E2DCFF',
                    background: currentNote?.id === n.id ? '#EDE9FF' : 'white',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '0.875rem', color: '#2C2855', fontWeight: 600 }}>📄 {n.fileName}</span>
                  <span style={{ fontSize: '0.75rem', color: '#7C75A6' }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
            <p style={{ color: '#7C75A6', fontSize: '0.75rem', marginTop: '1rem' }}>
              Guardado local en tu navegador con OCR real. Conecta la IA gratuita (Groq/Gemini) para resúmenes más inteligentes.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}

import { useCallback, useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import {
  Archive,
  BookOpen,
  CalendarRange,
  Check,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
  Upload
} from 'lucide-react';
import {
  CATEGORY_LABELS,
  GRADE_LEVELS,
  GRADE_PACK_PRICE_USD,
  WORD_DOC_TYPE_LABELS,
  formatUsd,
  gradeToAcademicLevel
} from '../constants.ts';
import type {
  AdminAuthStatus,
  GeneratedMaterialDraft,
  GradeLevel,
  MaterialAdmin,
  MaterialCategory,
  OrderRecord,
  PaymentGatewayConfig,
  WordDocType,
  WordDocumentRecord
} from '../types.ts';

export type StudioTab = 'word_studio' | 'academic_zip' | 'publish' | 'catalog' | 'payments';

interface CreatorStudioProps {
  authToken: string | null;
  requestedTab?: StudioTab;
  requestedGrade?: GradeLevel;
  requestedCategory?: MaterialCategory;
  requestNonce?: number;
  onAuthTokenChange: (token: string | null) => void;
  onCatalogMutated: () => void;
}

export function CreatorStudio({
  authToken,
  requestedTab,
  requestedGrade,
  requestedCategory,
  requestNonce,
  onAuthTokenChange,
  onCatalogMutated
}: CreatorStudioProps) {
  const [authStatus, setAuthStatus] = useState<AdminAuthStatus | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<StudioTab>('word_studio');
  const [materials, setMaterials] = useState<MaterialAdmin[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [wordDocs, setWordDocs] = useState<WordDocumentRecord[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalDownloads: 0,
    publishedCount: 0
  });
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig | null>(null);

  // Word Upload & AI Studio State
  const [wordGrade, setWordGrade] = useState<GradeLevel>('8° Grado');
  const [wordSubject, setWordSubject] = useState('Ciencia y Tecnología');
  const [wordDocType, setWordDocType] = useState<WordDocType>('manual_practica');
  const [wordCustomTitle, setWordCustomTitle] = useState('');
  const [wordPastedText, setWordPastedText] = useState('');
  const [selectedWordFiles, setSelectedWordFiles] = useState<
    { fileName: string; mimeType: string; base64Data: string }[]
  >([]);
  const [wordFilterGrade, setWordFilterGrade] = useState<'all' | GradeLevel>('all');
  const [catalogFilterGrade, setCatalogFilterGrade] = useState<'all' | GradeLevel>('all');
  const [wordUploading, setWordUploading] = useState(false);
  const [wordMessage, setWordMessage] = useState<string | null>(null);
  const [wordError, setWordError] = useState<string | null>(null);
  const [isDraggingWord, setIsDraggingWord] = useState(false);

  const [generatingWordId, setGeneratingWordId] = useState<string | null>(null);
  const [generatingMode, setGeneratingMode] = useState<'guia_facil' | 'planificacion' | null>(null);
  const [generatingStrategy, setGeneratingStrategy] = useState<'extract' | 'ai' | null>(null);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [activeDraft, setActiveDraft] = useState<{
    draft: GeneratedMaterialDraft;
    sourceWordId: string;
  } | null>(null);
  const [draftPublishing, setDraftPublishing] = useState(false);

  // Direct Publish Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('practicas');
  const [grade, setGrade] = useState<GradeLevel>('4° Grado');
  const [subjectArea, setSubjectArea] = useState('Ciencia y Tecnología');
  const [price, setPrice] = useState(GRADE_PACK_PRICE_USD.toFixed(2));
  const [pages, setPages] = useState('12');
  const [durationOrScope, setDurationOrScope] = useState('Grado completo · Año escolar');
  const [previewExcerpt, setPreviewExcerpt] = useState('');
  const [objectivesText, setObjectivesText] = useState(
    'Comprender los principios científicos clave del grado.\nAplicar el método experimental de forma guiada.'
  );
  const [tocText, setTocText] = useState(
    '1. Marco teórico general\n2. Desarrollo experimental o guía docente\n3. Actividades de aplicación'
  );
  const [sectionHeading, setSectionHeading] = useState('Desarrollo del Material');
  const [sectionBody, setSectionBody] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    mimeType: string;
    base64Data: string;
  } | null>(null);

  const [publishLoading, setPublishLoading] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Gestión Académica (.ZIP) Upload Form State
  const [zipTitle, setZipTitle] = useState('');
  const [zipSubtitle, setZipSubtitle] = useState('');
  const [zipScope, setZipScope] = useState('Colección documental · Gestión Académica');
  const [zipPreviewExcerpt, setZipPreviewExcerpt] = useState('');
  const [zipTocText, setZipTocText] = useState(
    '1. Formatos de planificación y evaluación\n2. Registros académicos y rúbricas\n3. Anexos editables para el docente'
  );
  const [zipFile, setZipFile] = useState<{
    fileName: string;
    mimeType: string;
    base64Data: string;
  } | null>(null);
  const [isDraggingZip, setIsDraggingZip] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipFeedback, setZipFeedback] = useState<string | null>(null);
  const [zipError, setZipError] = useState<string | null>(null);

  useEffect(() => {
    if (requestedTab) {
      setActiveTab(requestedTab);
    }
    if (requestedGrade) {
      setGrade(requestedGrade);
      setWordGrade(requestedGrade);
    }
    if (requestedCategory) {
      setCategory(requestedCategory);
      if (requestedCategory === 'apuntes') {
        setPages('1');
      } else if (requestedCategory === 'practicas') {
        setPages('18');
      } else {
        setPages('8');
      }
    }
  }, [requestedTab, requestedGrade, requestedCategory, requestNonce]);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;
      const res = await fetch('/api/admin/auth-status', { headers });
      if (res.ok) {
        const data = (await res.json()) as AdminAuthStatus;
        setAuthStatus(data);
        if (authToken && !data.authenticated) {
          onAuthTokenChange(null);
        }
      }
    } catch {
      // ignore network blip
    }
  }, [authToken, onAuthTokenChange]);

  const fetchOverview = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.status === 401) {
        onAuthTokenChange(null);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMaterials(data.materials);
        setOrders(data.orders);
        setWordDocs(data.wordDocs || []);
        setStats(data.stats);
        setPaymentConfig(data.paymentConfig);
        setGeminiConfigured(Boolean(data.geminiConfigured));
      }
    } catch {
      // ignore
    }
  }, [authToken, onAuthTokenChange]);

  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  useEffect(() => {
    if (authToken) {
      fetchOverview();
    }
  }, [authToken, fetchOverview]);

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const endpoint = authStatus?.configured ? '/api/admin/login' : '/api/admin/setup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error de autenticación.');
      }
      setPasswordInput('');
      onAuthTokenChange(data.token);
      await fetchAuthStatus();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error de acceso.');
    } finally {
      setAuthLoading(false);
    }
  }

  function readFilesToBase64(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    Promise.all(
      files.map(
        (file) =>
          new Promise<{ fileName: string; mimeType: string; base64Data: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve({
                  fileName: file.name,
                  mimeType:
                    file.type ||
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  base64Data: reader.result
                });
              } else {
                reject(new Error('No se pudo leer el archivo.'));
              }
            };
            reader.onerror = () => reject(new Error(`Error leyendo ${file.name}`));
            reader.readAsDataURL(file);
          })
      )
    )
      .then((loaded) => {
        setSelectedWordFiles((prev) => [...prev, ...loaded]);
        setWordError(null);
      })
      .catch((err) => {
        setWordError(err instanceof Error ? err.message : 'Error leyendo archivos.');
      });
  }

  function handleWordDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDraggingWord(false);
    readFilesToBase64(e.dataTransfer.files);
  }

  async function handleWordUploadSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authToken) return;
    setWordError(null);
    setWordMessage(null);

    if (selectedWordFiles.length === 0 && wordPastedText.trim().length < 20) {
      setWordError('Selecciona al menos un archivo Word (.docx) o pega el contenido del manual.');
      return;
    }

    setWordUploading(true);
    try {
      if (selectedWordFiles.length > 0) {
        let uploadedCount = 0;
        for (const file of selectedWordFiles) {
          const res = await fetch('/api/admin/word-docs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({
              title: selectedWordFiles.length === 1 && wordCustomTitle.trim() ? wordCustomTitle.trim() : undefined,
              grade: wordGrade,
              subjectArea: wordSubject,
              docType: wordDocType,
              fileUpload: file
            })
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || `Error subiendo ${file.fileName}`);
          }
          uploadedCount += 1;
        }
        setSelectedWordFiles([]);
        setWordCustomTitle('');
        setWordMessage(
          `${uploadedCount} ${uploadedCount === 1 ? 'documento guardado' : 'documentos guardados'} en ${wordGrade}. Ya puedes generar sus guías fáciles o planificaciones.`
        );
      } else {
        const res = await fetch('/api/admin/word-docs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            title: wordCustomTitle.trim() || `Manual ${wordSubject} (${wordGrade})`,
            grade: wordGrade,
            subjectArea: wordSubject,
            docType: wordDocType,
            pastedText: wordPastedText.trim()
          })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'No se pudo guardar el texto.');
        }
        setWordPastedText('');
        setWordCustomTitle('');
        setWordMessage(`Manual guardado en ${wordGrade}. Ya puedes generar su guía fácil o planificación.`);
      }

      await fetchOverview();
    } catch (err) {
      setWordError(err instanceof Error ? err.message : 'Error subiendo documento Word.');
    } finally {
      setWordUploading(false);
    }
  }

  async function handleGenerateFromWord(
    wordDocId: string,
    mode: 'guia_facil' | 'planificacion',
    strategy: 'extract' | 'ai' = 'extract'
  ) {
    if (!authToken) return;
    setWordError(null);
    setWordMessage(null);
    setGeneratingWordId(wordDocId);
    setGeneratingMode(mode);
    setGeneratingStrategy(strategy);

    try {
      const endpoint =
        strategy === 'ai'
          ? `/api/admin/word-docs/${encodeURIComponent(wordDocId)}/generate`
          : `/api/admin/word-docs/${encodeURIComponent(wordDocId)}/extract-draft`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(
          strategy === 'ai' ? { mode, customInstructions } : { mode }
        )
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error procesando el documento Word.');
      }

      setActiveDraft({
        draft: data.draft as GeneratedMaterialDraft,
        sourceWordId: wordDocId
      });
    } catch (err) {
      setWordError(err instanceof Error ? err.message : 'Error generando guía desde Word.');
    } finally {
      setGeneratingWordId(null);
      setGeneratingMode(null);
      setGeneratingStrategy(null);
    }
  }

  async function handlePublishGeneratedDraft(e: FormEvent) {
    e.preventDefault();
    if (!authToken || !activeDraft) return;
    setDraftPublishing(true);
    setWordError(null);

    try {
      const { draft, sourceWordId } = activeDraft;
      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: draft.title,
          subtitle: draft.subtitle,
          category: draft.category,
          subjectArea: draft.subjectArea,
          level: draft.level,
          grade: draft.grade,
          price: draft.suggestedPrice,
          format: 'PDF Imprimible',
          pages: draft.pages,
          durationOrScope: draft.durationOrScope,
          previewExcerpt: draft.previewExcerpt,
          objectives: draft.objectives,
          tableOfContents: draft.tableOfContents,
          contentSections: draft.contentSections,
          isComplementaryGuide: draft.mode === 'guia_facil',
          sourceWordId,
          published: true
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo publicar el borrador.');
      }

      setWordMessage(
        `¡Publicado! "${data.material.title}" ya está disponible en el catálogo para ${data.material.grade}.`
      );
      setActiveDraft(null);
      await fetchOverview();
      onCatalogMutated();
    } catch (err) {
      setWordError(err instanceof Error ? err.message : 'Error publicando borrador.');
    } finally {
      setDraftPublishing(false);
    }
  }

  async function handleDeleteWordDoc(wordDocId: string) {
    if (!authToken) return;
    const res = await fetch(`/api/admin/word-docs/${encodeURIComponent(wordDocId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (res.ok) {
      await fetchOverview();
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setUploadedFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedFile({
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64Data: reader.result
        });
      }
    };
    reader.readAsDataURL(file);
  }

  async function handlePublishMaterial(e: FormEvent) {
    e.preventDefault();
    if (!authToken) return;
    setPublishError(null);
    setPublishFeedback(null);
    setPublishLoading(true);

    try {
      const objectives = objectivesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const tableOfContents = tocText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const level = category === 'planificaciones' ? 'Docentes' : gradeToAcademicLevel(grade);

      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title,
          subtitle,
          category,
          subjectArea,
          level,
          grade,
          price: Number(price),
          pages: Number(pages),
          durationOrScope,
          previewExcerpt,
          objectives,
          tableOfContents,
          contentSections: [
            {
              heading: sectionHeading || 'Contenido Principal',
              body: sectionBody || previewExcerpt || subtitle
            }
          ],
          fileUpload: uploadedFile || undefined,
          published: true
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo publicar el material.');
      }

      setTitle('');
      setSubtitle('');
      setPreviewExcerpt('');
      setSectionBody('');
      setUploadedFile(null);
      setPublishFeedback(`Material "${data.material.title}" publicado en la pestaña ${data.material.grade}.`);
      await fetchOverview();
      onCatalogMutated();
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Error publicando material.');
    } finally {
      setPublishLoading(false);
    }
  }

  function readZipFileToBase64(file: File | undefined) {
    if (!file) {
      setZipFile(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setZipFile({
          fileName: file.name,
          mimeType: file.type || 'application/zip',
          base64Data: reader.result
        });
        setZipError(null);
        if (!zipTitle.trim()) {
          setZipTitle(file.name.replace(/\.zip$/i, '').replace(/[_-]+/g, ' '));
        }
      }
    };
    reader.onerror = () => setZipError('No se pudo leer el archivo .zip seleccionado.');
    reader.readAsDataURL(file);
  }

  function handleZipDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDraggingZip(false);
    readZipFileToBase64(e.dataTransfer.files?.[0]);
  }

  async function handleZipPublishSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authToken) return;
    setZipError(null);
    setZipFeedback(null);

    if (!zipFile) {
      setZipError('Adjunta un paquete comprimido (.zip) antes de publicarlo en Gestión Académica.');
      return;
    }
    if (!zipTitle.trim()) {
      setZipError('Escribe un título visible para el paquete .zip.');
      return;
    }

    setZipLoading(true);
    try {
      const tocLines = zipTocText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          title: zipTitle.trim(),
          subtitle:
            zipSubtitle.trim() ||
            'Paquete institucional comprimido (.zip) disponible en la pestaña Gestión Académica.',
          category: 'folletos',
          subjectArea: 'Gestión Académica',
          level: 'Gestión Académica',
          grade: 'Gestión Académica',
          price: GRADE_PACK_PRICE_USD,
          format: 'Archivo ZIP · Gestión Académica',
          pages: 1,
          durationOrScope: zipScope.trim() || 'Paquete .ZIP completo',
          previewExcerpt:
            zipPreviewExcerpt.trim() ||
            `Visualización general de la estructura del paquete comprimido .zip para consulta pública. La descarga requiere activar el acceso de Gestión Académica (${formatUsd(GRADE_PACK_PRICE_USD)}).`,
          objectives: [
            'Centralizar documentación institucional y académica en un solo paquete descargable.',
            'Ofrecer vista previa general del contenido antes de habilitar la descarga.'
          ],
          tableOfContents: tocLines,
          contentSections: [
            {
              heading: 'Contenido del paquete ZIP',
              body:
                zipPreviewExcerpt.trim() ||
                'Este paquete comprimido incluye los archivos listados en la vista previa general.'
            }
          ],
          fileUpload: zipFile,
          published: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo publicar el paquete .zip.');
      }

      setZipTitle('');
      setZipSubtitle('');
      setZipPreviewExcerpt('');
      setZipFile(null);
      setZipFeedback(
        `¡Paquete "${data.material.title}" publicado en la pestaña Gestión Académica con vista previa de archivos!`
      );
      await fetchOverview();
      onCatalogMutated();
    } catch (err) {
      setZipError(err instanceof Error ? err.message : 'Error publicando el archivo .zip.');
    } finally {
      setZipLoading(false);
    }
  }

  async function togglePublish(material: MaterialAdmin) {
    if (!authToken) return;
    const res = await fetch(`/api/admin/materials/${encodeURIComponent(material.id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ published: !material.published })
    });
    if (res.ok) {
      await fetchOverview();
      onCatalogMutated();
    }
  }

  async function updatePrice(material: MaterialAdmin, newPrice: number) {
    if (!authToken) return;
    const res = await fetch(`/api/admin/materials/${encodeURIComponent(material.id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ price: newPrice })
    });
    if (res.ok) {
      await fetchOverview();
      onCatalogMutated();
    }
  }

  async function updateGrade(material: MaterialAdmin, newGrade: GradeLevel) {
    if (!authToken) return;
    const res = await fetch(`/api/admin/materials/${encodeURIComponent(material.id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ grade: newGrade })
    });
    if (res.ok) {
      await fetchOverview();
      onCatalogMutated();
    }
  }

  async function deleteMaterial(materialId: string) {
    if (!authToken) return;
    const res = await fetch(`/api/admin/materials/${encodeURIComponent(materialId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    if (res.ok) {
      await fetchOverview();
      onCatalogMutated();
    }
  }

  const filteredWordDocs = wordDocs.filter((doc) =>
    wordFilterGrade === 'all' ? true : doc.grade === wordFilterGrade
  );
  const filteredCatalogMaterials = materials.filter((m) =>
    catalogFilterGrade === 'all' ? true : m.grade === catalogFilterGrade
  );

  return (
    <section id="creador" className="py-16 border-t border-slate-200 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium text-teal-800 mb-1">
              Repositorio Word, Generación de Guías y Monetización
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Espacio del Creador</h2>
          </div>

          {authToken && (
            <button
              type="button"
              onClick={() => onAuthTokenChange(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión de creador
            </button>
          )}
        </div>

        {!authToken ? (
          <div className="max-w-md bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {authStatus?.configured ? 'Acceso privado del docente / creador' : 'Configura tu clave de creador'}
                </h3>
                <p className="text-xs text-slate-500">
                  {authStatus?.configured
                    ? 'Ingresa tu contraseña para subir tus archivos Word, generar guías fáciles por grado y gestionar ventas.'
                    : 'Crea una contraseña única (mínimo 6 caracteres) para proteger tu repositorio Word y panel de ventas.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label htmlFor="creator-pass" className="block text-xs font-medium text-slate-700 mb-1">
                  {authStatus?.configured ? 'Contraseña de creador' : 'Nueva contraseña de creador'}
                </label>
                <input
                  id="creator-pass"
                  type="password"
                  required
                  minLength={6}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              {authError && <p className="text-xs text-rose-700">{authError}</p>}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                {authLoading
                  ? 'Verificando...'
                  : authStatus?.configured
                    ? 'Entrar al Espacio Creador'
                    : 'Guardar clave y entrar'}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Metrics Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">Ingresos totales</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                  ${stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">Manuales Word cargados</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">{wordDocs.length}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">Descargas entregadas</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">{stats.totalDownloads}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">Materiales publicados</p>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">{stats.publishedCount}</p>
              </div>
            </div>

            {/* Studio Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setActiveTab('word_studio')}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'word_studio'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Biblioteca Word y Guías ({wordDocs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('academic_zip')}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'academic_zip'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Anexar .ZIP (Gestión Académica)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('publish')}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'publish' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Publicar por grado
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'catalog' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gestionar catálogo ({materials.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === 'payments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ventas y pasarelas ({orders.length})
              </button>
            </div>

            {/* TAB 1: Word Library & Automatic Complementary Guide / Grade Lesson Plan Studio */}
            {activeTab === 'word_studio' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Upload Word Files Form */}
                  <form
                    onSubmit={handleWordUploadSubmit}
                    className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 space-y-5"
                  >
                    <div>
                      <h3 className="text-base font-bold text-slate-900">1. Deja aquí tus archivos en Word</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Sube tus manuales de práctica, apuntes o temarios en Word (.docx) organizados por grado. Luego
                        podrás generar guías fáciles complementarias y planificaciones listas para vender o descargar.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="word-grade" className="block text-xs font-medium text-slate-700 mb-1">
                          Grado / Nivel
                        </label>
                        <select
                          id="word-grade"
                          value={wordGrade}
                          onChange={(e) => setWordGrade(e.target.value as GradeLevel)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                        >
                          {GRADE_LEVELS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="word-doctype" className="block text-xs font-medium text-slate-700 mb-1">
                          Tipo de documento
                        </label>
                        <select
                          id="word-doctype"
                          value={wordDocType}
                          onChange={(e) => setWordDocType(e.target.value as WordDocType)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                        >
                          {(Object.keys(WORD_DOC_TYPE_LABELS) as WordDocType[]).map((t) => (
                            <option key={t} value={t}>
                              {WORD_DOC_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="word-subject" className="block text-xs font-medium text-slate-700 mb-1">
                          Área / Materia
                        </label>
                        <input
                          id="word-subject"
                          type="text"
                          value={wordSubject}
                          onChange={(e) => setWordSubject(e.target.value)}
                          placeholder="Química, Biología, Física..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label htmlFor="word-title" className="block text-xs font-medium text-slate-700 mb-1">
                          Título (opcional)
                        </label>
                        <input
                          id="word-title"
                          type="text"
                          value={wordCustomTitle}
                          onChange={(e) => setWordCustomTitle(e.target.value)}
                          placeholder="Se toma del archivo si se omite"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Drag and drop zone for multiple .docx files */}
                    <div>
                      <label
                        htmlFor="word-file-input"
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingWord(true);
                        }}
                        onDragLeave={() => setIsDraggingWord(false)}
                        onDrop={handleWordDrop}
                        className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                          isDraggingWord
                            ? 'border-teal-700 bg-teal-50/60'
                            : 'border-slate-300 bg-slate-50 hover:border-teal-700'
                        }`}
                      >
                        <Upload className="w-6 h-6 text-teal-700 mb-2" />
                        <span className="text-xs font-semibold text-slate-900">
                          Arrastra tus archivos Word (.docx) o haz clic para seleccionarlos
                        </span>
                        <span className="text-[11px] text-slate-500 mt-1">
                          Puedes subir varios manuales de práctica a la vez (.docx, .txt, .md)
                        </span>
                      </label>
                      <input
                        id="word-file-input"
                        type="file"
                        multiple
                        accept=".docx,.txt,.md,.html"
                        onChange={(e) => readFilesToBase64(e.target.files)}
                        className="sr-only"
                      />

                      {selectedWordFiles.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {selectedWordFiles.map((f, idx) => (
                            <li
                              key={`${f.fileName}-${idx}`}
                              className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-teal-50 border border-teal-200 text-xs text-teal-900"
                            >
                              <span className="truncate font-medium">{f.fileName}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedWordFiles((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="text-teal-800 hover:text-rose-700 cursor-pointer shrink-0"
                              >
                                Quitar
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <label htmlFor="word-paste" className="block text-xs font-medium text-slate-700 mb-1">
                        O pega directamente el texto de tu documento Word
                      </label>
                      <textarea
                        id="word-paste"
                        rows={3}
                        value={wordPastedText}
                        onChange={(e) => setWordPastedText(e.target.value)}
                        placeholder="Pega aquí el contenido de tu práctica de laboratorio o programa..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                      />
                    </div>

                    {wordError && (
                      <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                        {wordError}
                      </div>
                    )}
                    {wordMessage && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900">
                        <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                        <span>{wordMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={wordUploading}
                      className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {wordUploading ? 'Extrayendo texto y guardando...' : 'Guardar en Biblioteca Word'}
                    </button>
                  </form>

                  {/* Word Repository List + Generation Buttons */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            2. Manuales cargados y generación automática
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Elige un documento Word y genera su guía fácil complementaria o su planificación por grado.
                          </p>
                        </div>

                        <select
                          value={wordFilterGrade}
                          onChange={(e) => setWordFilterGrade(e.target.value as 'all' | GradeLevel)}
                          aria-label="Filtrar documentos Word por grado"
                          className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
                        >
                          <option value="all">Todos los grados ({wordDocs.length})</option>
                          {GRADE_LEVELS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="ai-custom-notes" className="block text-xs font-medium text-slate-700 mb-1">
                          Indicaciones opcionales antes de generar (ej. &ldquo;Enfocar en ejercicios fáciles y glosario&rdquo;)
                        </label>
                        <input
                          id="ai-custom-notes"
                          type="text"
                          value={customInstructions}
                          onChange={(e) => setCustomInstructions(e.target.value)}
                          placeholder="Opcional: tono más visual, incluir 5 preguntas de repaso, adaptar a 45 min..."
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-xs text-slate-900"
                        />
                      </div>

                      {filteredWordDocs.length === 0 ? (
                        <div className="p-8 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2">
                          <FileText className="w-7 h-7 text-slate-400 mx-auto" />
                          <p className="text-sm font-semibold text-slate-900">
                            No hay archivos Word cargados en este filtro
                          </p>
                          <p className="text-xs text-slate-500 max-w-md mx-auto">
                            Sube un archivo `.docx` o pega el texto de tu manual de práctica en el panel izquierdo para
                            empezar a crear guías fáciles y planificaciones automáticas.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredWordDocs.map((doc) => {
                            const isGeneratingThis = generatingWordId === doc.id;
                            return (
                              <div
                                key={doc.id}
                                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-xs text-teal-800 font-medium">
                                      {doc.grade} <span aria-hidden="true">·</span> {WORD_DOC_TYPE_LABELS[doc.docType]}{' '}
                                      <span aria-hidden="true">·</span> {doc.subjectArea}
                                    </p>
                                    <h4 className="text-sm font-bold text-slate-900 truncate mt-0.5">{doc.title}</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono tabular-nums">
                                      {doc.fileName} · {doc.wordCount} palabras ·{' '}
                                      {doc.generatedMaterialIds.length} derivados publicados
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        fetch(`/api/admin/word-docs/${encodeURIComponent(doc.id)}/download`, {
                                          headers: { Authorization: `Bearer ${authToken}` }
                                        })
                                          .then((r) => r.blob())
                                          .then((blob) => {
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = doc.fileName;
                                            a.click();
                                            URL.revokeObjectURL(url);
                                          });
                                      }}
                                      title="Descargar Word original"
                                      className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 cursor-pointer"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteWordDoc(doc.id)}
                                      title="Eliminar documento"
                                      className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                  <button
                                    type="button"
                                    disabled={Boolean(generatingWordId)}
                                    onClick={() => handleGenerateFromWord(doc.id, 'guia_facil', 'extract')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                                  >
                                    {isGeneratingThis &&
                                    generatingMode === 'guia_facil' &&
                                    generatingStrategy === 'extract' ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <BookOpen className="w-3.5 h-3.5" />
                                    )}
                                    Crear Guía General (1 pág.)
                                  </button>

                                  <button
                                    type="button"
                                    disabled={Boolean(generatingWordId)}
                                    onClick={() => handleGenerateFromWord(doc.id, 'planificacion', 'extract')}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                                  >
                                    {isGeneratingThis &&
                                    generatingMode === 'planificacion' &&
                                    generatingStrategy === 'extract' ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CalendarRange className="w-3.5 h-3.5" />
                                    )}
                                    Crear Planificación ({doc.grade})
                                  </button>

                                  {geminiConfigured && (
                                    <button
                                      type="button"
                                      disabled={Boolean(generatingWordId)}
                                      onClick={() => handleGenerateFromWord(doc.id, 'guia_facil', 'ai')}
                                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-teal-200 bg-teal-50/70 hover:bg-teal-100 text-teal-900 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                                    >
                                      {isGeneratingThis &&
                                      generatingMode === 'guia_facil' &&
                                      generatingStrategy === 'ai' ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Sparkles className="w-3.5 h-3.5" />
                                      )}
                                      Enriquecer Guía (1 pág.) con IA
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generated Draft Review & One-Click Publish Panel */}
                {activeDraft && (
                  <form
                    onSubmit={handlePublishGeneratedDraft}
                    className="bg-white rounded-xl border-2 border-teal-700/30 p-6 sm:p-8 space-y-6 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                      <div>
                        <p className="text-xs font-semibold text-teal-800">
                          Borrador generado automáticamente · {activeDraft.draft.grade}
                        </p>
                        <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                          Revisa, ajusta el precio y publica en tu catálogo
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveDraft(null)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer self-start sm:self-auto"
                      >
                        Descartar borrador
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">Título del material</label>
                        <input
                          type="text"
                          required
                          value={activeDraft.draft.title}
                          onChange={(e) =>
                            setActiveDraft({
                              ...activeDraft,
                              draft: { ...activeDraft.draft, title: e.target.value }
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Grado</label>
                        <select
                          value={activeDraft.draft.grade}
                          onChange={(e) =>
                            setActiveDraft({
                              ...activeDraft,
                              draft: { ...activeDraft.draft, grade: e.target.value as GradeLevel }
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
                        >
                          {GRADE_LEVELS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Precio (USD)</label>
                        <input
                          type="number"
                          step="0.50"
                          min="0"
                          value={activeDraft.draft.suggestedPrice}
                          onChange={(e) =>
                            setActiveDraft({
                              ...activeDraft,
                              draft: { ...activeDraft.draft, suggestedPrice: Number(e.target.value) || 0 }
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 font-mono text-sm text-slate-900"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Resumen para la tienda
                        </label>
                        <textarea
                          rows={2}
                          value={activeDraft.draft.previewExcerpt}
                          onChange={(e) =>
                            setActiveDraft({
                              ...activeDraft,
                              draft: { ...activeDraft.draft, previewExcerpt: e.target.value }
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-700">
                        Vista previa de secciones incluidas en el PDF descargable
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeDraft.draft.contentSections.map((sec, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                            <p className="text-xs font-bold text-slate-900">{sec.heading}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{sec.body}</p>
                            {sec.bullets && sec.bullets.length > 0 && (
                              <ul className="space-y-1 pt-1">
                                {sec.bullets.map((b, bIdx) => (
                                  <li key={bIdx} className="text-[11px] text-slate-600">
                                    • {b}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={draftPublishing}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                      >
                        <Check className="w-4 h-4" />
                        {draftPublishing ? 'Publicando PDF...' : 'Publicar en catálogo para este grado'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: Anexar .ZIP (Gestión Académica) */}
            {activeTab === 'academic_zip' && (
              <form
                onSubmit={handleZipPublishSubmit}
                className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-semibold text-teal-800">
                      Pestaña Extra · Gestión Académica ({formatUsd(GRADE_PACK_PRICE_USD)} para descarga)
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                      Anexar paquete comprimido (.zip) en Gestión Académica
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
                    <Archive className="w-3.5 h-3.5 text-teal-700" />
                    Solo vista previa general al público
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="zip-file-input"
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingZip(true);
                      }}
                      onDragLeave={() => setIsDraggingZip(false)}
                      onDrop={handleZipDrop}
                      className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                        isDraggingZip
                          ? 'border-teal-700 bg-teal-50/60'
                          : 'border-slate-300 bg-slate-50 hover:border-teal-700'
                      }`}
                    >
                      <Archive className="w-7 h-7 text-teal-700 mb-2" />
                      <span className="text-sm font-semibold text-slate-900">
                        {zipFile ? `Archivo listo: ${zipFile.fileName}` : 'Arrastra tu archivo .ZIP o haz clic para seleccionarlo'}
                      </span>
                      <span className="text-xs text-slate-500 mt-1 max-w-lg">
                        Al subir el .ZIP, CienciaLab lee el índice interno para mostrar una vista previa general de los archivos al público (sin permitir descarga gratuita hasta pagar {formatUsd(GRADE_PACK_PRICE_USD)}).
                      </span>
                    </label>
                    <input
                      id="zip-file-input"
                      type="file"
                      accept=".zip,application/zip,application/x-zip-compressed"
                      onChange={(e) => readZipFileToBase64(e.target.files?.[0])}
                      className="sr-only"
                    />
                  </div>

                  <div>
                    <label htmlFor="zip-title" className="block text-xs font-medium text-slate-700 mb-1">
                      Título del paquete en Gestión Académica
                    </label>
                    <input
                      id="zip-title"
                      type="text"
                      required
                      value={zipTitle}
                      onChange={(e) => setZipTitle(e.target.value)}
                      placeholder="Ej. Paquete de Formatos, Jornalizaciones y Actas 2026"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="zip-scope" className="block text-xs font-medium text-slate-700 mb-1">
                      Alcance o contenido principal
                    </label>
                    <input
                      id="zip-scope"
                      type="text"
                      value={zipScope}
                      onChange={(e) => setZipScope(e.target.value)}
                      placeholder="Colección documental · Gestión Académica"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="zip-subtitle" className="block text-xs font-medium text-slate-700 mb-1">
                      Subtítulo breve
                    </label>
                    <input
                      id="zip-subtitle"
                      type="text"
                      value={zipSubtitle}
                      onChange={(e) => setZipSubtitle(e.target.value)}
                      placeholder="Documentación institucional, rúbricas y registros editables comprimidos en .ZIP."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="zip-excerpt" className="block text-xs font-medium text-slate-700 mb-1">
                      Descripción general visible para el público (solo lectura)
                    </label>
                    <textarea
                      id="zip-excerpt"
                      rows={3}
                      value={zipPreviewExcerpt}
                      onChange={(e) => setZipPreviewExcerpt(e.target.value)}
                      placeholder="Describe qué incluye este paquete .zip para que los docentes vean el contenido general antes de adquirirlo."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="zip-toc" className="block text-xs font-medium text-slate-700 mb-1">
                      Resumen del índice visible al público (uno por línea)
                    </label>
                    <textarea
                      id="zip-toc"
                      rows={3}
                      value={zipTocText}
                      onChange={(e) => setZipTocText(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900"
                    />
                  </div>
                </div>

                {zipError && (
                  <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    {zipError}
                  </div>
                )}
                {zipFeedback && (
                  <div className="flex items-center gap-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 px-3.5 py-2.5 rounded-lg">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{zipFeedback}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={zipLoading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Archive className="w-4 h-4" />
                  {zipLoading
                    ? 'Subiendo e indexando .ZIP...'
                    : `Publicar .ZIP en Gestión Académica (${formatUsd(GRADE_PACK_PRICE_USD)})`}
                </button>
              </form>
            )}

            {/* TAB 3: Direct Publish Material */}
            {activeTab === 'publish' && (
              <form
                onSubmit={handlePublishMaterial}
                className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label htmlFor="pub-title" className="block text-xs font-medium text-slate-700 mb-1">
                      Título del material
                    </label>
                    <input
                      id="pub-title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ej. Práctica de Laboratorio: Titulación Ácido-Base con Indicadores Naturales"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="pub-subtitle" className="block text-xs font-medium text-slate-700 mb-1">
                      Subtítulo breve
                    </label>
                    <input
                      id="pub-subtitle"
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Protocolo experimental imprimible con guía docente y rúbrica de laboratorio."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="pub-cat" className="block text-xs font-medium text-slate-700 mb-1">
                      Categoría
                    </label>
                    <select
                      id="pub-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    >
                      {(Object.keys(CATEGORY_LABELS) as MaterialCategory[]).map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pub-grade" className="block text-xs font-medium text-slate-700 mb-1">
                      Grado / Nivel
                    </label>
                    <select
                      id="pub-grade"
                      value={grade}
                      onChange={(e) => setGrade(e.target.value as GradeLevel)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    >
                      {GRADE_LEVELS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="pub-subject" className="block text-xs font-medium text-slate-700 mb-1">
                      Área o asignatura
                    </label>
                    <input
                      id="pub-subject"
                      type="text"
                      value={subjectArea}
                      onChange={(e) => setSubjectArea(e.target.value)}
                      placeholder="Química, Física, Robótica, Biología..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="pub-price" className="block text-xs font-medium text-slate-700 mb-1">
                        Tarifa del grado (USD)
                      </label>
                      <input
                        id="pub-price"
                        type="number"
                        step="0.50"
                        min="1"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                      />
                    </div>
                    <div>
                      <label htmlFor="pub-pages" className="block text-xs font-medium text-slate-700 mb-1">
                        Páginas
                      </label>
                      <input
                        id="pub-pages"
                        type="number"
                        min="1"
                        value={pages}
                        onChange={(e) => setPages(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pub-scope" className="block text-xs font-medium text-slate-700 mb-1">
                      Duración o alcance
                    </label>
                    <input
                      id="pub-scope"
                      type="text"
                      value={durationOrScope}
                      onChange={(e) => setDurationOrScope(e.target.value)}
                      placeholder="Ej. Sesión de 90 min / Unidad 3"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="pub-file" className="block text-xs font-medium text-slate-700 mb-1">
                      Archivo descargable (PDF, DOCX, PPTX, ZIP) — Opcional
                    </label>
                    <label
                      htmlFor="pub-file"
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-700 cursor-pointer hover:border-teal-700 transition-colors"
                    >
                      <span className="truncate">
                        {uploadedFile ? uploadedFile.fileName : 'Adjuntar archivo o generar PDF automático'}
                      </span>
                      <Upload className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                    </label>
                    <input
                      id="pub-file"
                      type="file"
                      accept=".pdf,.docx,.doc,.pptx,.xlsx,.zip,.md,.txt,.html"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="pub-excerpt" className="block text-xs font-medium text-slate-700 mb-1">
                      Descripción visible en la tienda
                    </label>
                    <textarea
                      id="pub-excerpt"
                      rows={3}
                      value={previewExcerpt}
                      onChange={(e) => setPreviewExcerpt(e.target.value)}
                      placeholder="Explica qué incluye este material y cómo ayuda al estudiante o docente."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="pub-objectives" className="block text-xs font-medium text-slate-700 mb-1">
                      Objetivos (uno por línea)
                    </label>
                    <textarea
                      id="pub-objectives"
                      rows={3}
                      value={objectivesText}
                      onChange={(e) => setObjectivesText(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="pub-toc" className="block text-xs font-medium text-slate-700 mb-1">
                      Índice de contenidos (uno por línea)
                    </label>
                    <textarea
                      id="pub-toc"
                      rows={3}
                      value={tocText}
                      onChange={(e) => setTocText(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  {!uploadedFile && (
                    <div className="md:col-span-2 grid grid-cols-1 gap-3 pt-2 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-600">
                        Si no adjuntas un archivo propio, CienciaLab generará un PDF profesional automáticamente con este
                        contenido:
                      </p>
                      <input
                        type="text"
                        value={sectionHeading}
                        onChange={(e) => setSectionHeading(e.target.value)}
                        placeholder="Encabezado de la sección principal"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900"
                      />
                      <textarea
                        rows={4}
                        value={sectionBody}
                        onChange={(e) => setSectionBody(e.target.value)}
                        placeholder="Texto completo de la guía, pasos de laboratorio o planificación..."
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900"
                      />
                    </div>
                  )}
                </div>

                {publishError && <p className="text-xs text-rose-700">{publishError}</p>}
                {publishFeedback && (
                  <div className="flex items-center gap-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 px-3.5 py-2.5 rounded-lg">
                    <Check className="w-4 h-4" />
                    <span>{publishFeedback}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={publishLoading}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {publishLoading ? 'Publicando...' : 'Publicar en tienda'}
                </button>
              </form>
            )}

            {/* TAB 3: Manage Catalog */}
            {activeTab === 'catalog' && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-medium text-slate-600">
                    Mostrando <span className="font-mono font-semibold text-slate-900">{filteredCatalogMaterials.length}</span> de{' '}
                    <span className="font-mono">{materials.length}</span> materiales
                  </p>
                  <select
                    value={catalogFilterGrade}
                    onChange={(e) => setCatalogFilterGrade(e.target.value as 'all' | GradeLevel)}
                    aria-label="Filtrar catálogo por grado"
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
                  >
                    <option value="all">Todos los grados ({materials.length})</option>
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                        <th className="py-3.5 px-4">Material</th>
                        <th className="py-3.5 px-4">Grado</th>
                        <th className="py-3.5 px-4">Categoría</th>
                        <th className="py-3.5 px-4">Precio (USD)</th>
                        <th className="py-3.5 px-4">Descargas</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredCatalogMaterials.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70">
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-semibold text-slate-900 truncate">{m.title}</p>
                            <p className="text-xs text-slate-500">{m.format}</p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <select
                              value={m.grade}
                              onChange={(e) => updateGrade(m, e.target.value as GradeLevel)}
                              aria-label={`Grado de ${m.title}`}
                              className="px-2 py-1 rounded border border-slate-300 bg-white text-xs text-slate-800"
                            >
                              {GRADE_LEVELS.map((g) => (
                                <option key={g} value={g}>
                                  {g}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap text-xs">
                            {CATEGORY_LABELS[m.category]}
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums">
                            <input
                              type="number"
                              step="0.50"
                              min="0"
                              defaultValue={m.price.toFixed(2)}
                              onBlur={(e) => {
                                const val = Number(e.target.value);
                                if (!Number.isNaN(val) && val !== m.price) {
                                  updatePrice(m, val);
                                }
                              }}
                              aria-label={`Precio de ${m.title}`}
                              className="w-20 px-2 py-1 rounded border border-slate-300 text-xs font-mono text-slate-900"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">{m.downloadCount}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => togglePublish(m)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-teal-800 cursor-pointer"
                            >
                              {m.published ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-teal-700" />
                                  Publicado
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                  Oculto
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <a
                                href={`/api/download/${encodeURIComponent(m.id)}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  fetch(`/api/download/${encodeURIComponent(m.id)}`, {
                                    headers: { Authorization: `Bearer ${authToken}` }
                                  })
                                    .then((r) => r.blob())
                                    .then((blob) => {
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = m.customFileName || `${m.id}.pdf`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    });
                                }}
                                className="p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                                title="Probar descarga"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                              <button
                                type="button"
                                onClick={() => deleteMaterial(m.id)}
                                className="p-2 rounded-md border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors cursor-pointer"
                                title="Eliminar material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: Payments & Orders */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">PayPal Checkout REST v2</h3>
                      <span className="text-xs font-medium text-teal-800">
                        {paymentConfig?.paypalConfigured
                          ? `Habilitado (${paymentConfig.paypalMode})`
                          : 'Habilitado · Modo Sandbox'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Para cobrar dinero real en tu cuenta PayPal Business, configura las variables{' '}
                      <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">PAYPAL_CLIENT_ID</code>,{' '}
                      <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">PAYPAL_CLIENT_SECRET</code> y{' '}
                      <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">PAYPAL_MODE=live</code> en el panel
                      de Secrets del servidor.
                    </p>
                    <p className="text-xs pt-1">
                      <a
                        href="https://www.paypal.com/mep/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-teal-800 hover:underline"
                      >
                        Ir a PayPal Business para ver saldo y retirar dinero →
                      </a>
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">Tarjetas de Crédito / Débito (Stripe)</h3>
                      <span className="text-xs font-medium text-teal-800">
                        {paymentConfig?.stripeConfigured ? 'Habilitado (Stripe Live)' : 'Habilitado · Modo Sandbox'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Para aceptar tarjetas Visa, Mastercard y débito automáticamente mediante Stripe Checkout, agrega tu{' '}
                      <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">STRIPE_SECRET_KEY</code> en los
                      Secrets del proyecto.
                    </p>
                    <p className="text-xs pt-1">
                      <a
                        href="https://dashboard.stripe.com/payouts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-teal-800 hover:underline"
                      >
                        Ir a Stripe Dashboard para ver ganancias y transferencias →
                      </a>
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900">Historial de ventas recientes</h3>
                  </div>
                  {orders.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      Todavía no hay ventas registradas. Prueba realizar una compra desde el catálogo en Modo Sandbox.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                            <th className="py-3 px-4">Orden</th>
                            <th className="py-3 px-4">Comprador</th>
                            <th className="py-3 px-4">Método</th>
                            <th className="py-3 px-4">Materiales</th>
                            <th className="py-3 px-4 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {orders.map((order) => (
                            <tr key={order.id}>
                              <td className="py-3 px-4 font-mono text-slate-900">{order.orderCode}</td>
                              <td className="py-3 px-4 text-slate-700">
                                <span className="font-medium block text-slate-900">{order.buyerName}</span>
                                <span className="text-slate-500">{order.buyerEmail}</span>
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {order.paymentMethod === 'paypal' ? 'PayPal' : 'Tarjeta'} · {order.paymentMode}
                              </td>
                              <td className="py-3 px-4 text-slate-600 max-w-xs">
                                {order.unlockedGrades && order.unlockedGrades.length > 0 ? (
                                  <span className="font-medium text-slate-800">
                                    {order.unlockedGrades.join(', ')} ({order.items.length} archivos)
                                  </span>
                                ) : (
                                  <span>{order.items.slice(0, 3).map((i) => i.title).join(', ')}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                                {formatUsd(order.totalAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

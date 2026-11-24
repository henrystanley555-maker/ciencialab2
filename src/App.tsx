import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowRight,
  BookOpen,
  CalendarRange,
  Check,
  Download,
  Eye,
  FilePlus2,
  FlaskConical,
  Lock,
  Menu,
  Search,
  ShoppingBag,
  X
} from 'lucide-react';
import {
  CATEGORY_IMAGES,
  CURRICULUM_GRADES,
  GRADE_LEVELS,
  GRADE_PACK_PRICE_USD,
  GRADE_SUMMARIES,
  HERO_IMAGE,
  formatUsd
} from './constants.ts';
import { CheckoutDrawer } from './components/CheckoutDrawer.tsx';
import { CreatorStudio, type StudioTab } from './components/CreatorStudio.tsx';
import { DownloadsVault } from './components/DownloadsVault.tsx';
import { MaterialDetailModal } from './components/MaterialDetailModal.tsx';
import { ResilientImage } from './components/ResilientImage.tsx';
import type {
  GradeLevel,
  GradePackCartItem,
  MaterialCategory,
  MaterialPublic,
  OrderRecord,
  PaymentGatewayConfig
} from './types.ts';

interface CurriculumSlotDef {
  step: string;
  category: MaterialCategory;
  heading: string;
  emptyHint: string;
  icon: typeof FlaskConical;
}

const PRIMARY_GRADE_SLOTS: CurriculumSlotDef[] = [
  {
    step: '01',
    category: 'practicas',
    heading: 'Manual de Laboratorio Completo',
    emptyHint:
      'Espacio listo para adjuntar el manual de laboratorio completo sin desglosar correspondiente a este grado.',
    icon: FlaskConical
  },
  {
    step: '02',
    category: 'planificaciones',
    heading: 'Planificación del Grado',
    emptyHint:
      'Espacio reservado para la planificación docente anual, jornalización, indicadores de logro y rúbricas.',
    icon: CalendarRange
  }
];

export default function App() {
  const [materials, setMaterials] = useState<MaterialPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeGradeTab, setActiveGradeTab] = useState<GradeLevel>('4° Grado');
  const [guideSearch, setGuideSearch] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [cart, setCart] = useState<GradePackCartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialPublic | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  const [studioRequest, setStudioRequest] = useState<{
    tab: StudioTab;
    grade?: GradeLevel;
    category?: MaterialCategory;
    nonce: number;
  }>({
    tab: 'word_studio',
    nonce: 0
  });

  const fetchCatalog = useCallback(async () => {
    try {
      setLoadError(null);
      const [matRes, payRes] = await Promise.all([fetch('/api/materials'), fetch('/api/payments/config')]);
      if (!matRes.ok) {
        throw new Error('No se pudo cargar el catálogo de materiales.');
      }
      const matData = (await matRes.json()) as { materials: MaterialPublic[] };
      setMaterials(matData.materials);

      if (payRes.ok) {
        const payData = (await payRes.json()) as PaymentGatewayConfig;
        setPaymentConfig(payData);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSessionId = params.get('stripe_session_id');
    if (!stripeSessionId) return;

    fetch('/api/checkout/stripe-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: stripeSessionId })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.order) {
          setOrders((prev) => [data.order, ...prev.filter((o) => o.id !== data.order.id)]);
          const cleanUrl = window.location.pathname + '#descargas';
          window.history.replaceState({}, '', cleanUrl);
          document.getElementById('descargas')?.scrollIntoView({ behavior: 'smooth' });
        }
      })
      .catch(() => {
        // ignore verification network errors
      });
  }, []);

  const materialsByGrade = useMemo(() => {
    const map = new Map<GradeLevel, MaterialPublic[]>();
    for (const g of GRADE_LEVELS) {
      map.set(g, []);
    }
    for (const m of materials) {
      const list = map.get(m.grade) || [];
      list.push(m);
      map.set(m.grade, list);
    }
    return map;
  }, [materials]);

  const unlockedTokenByMaterialId = useMemo(() => {
    const map = new Map<string, string>();
    for (const order of orders) {
      for (const item of order.items) {
        if (!map.has(item.materialId)) {
          map.set(item.materialId, order.receiptToken);
        }
      }
    }
    return map;
  }, [orders]);

  const unlockedTokenByGrade = useMemo(() => {
    const map = new Map<GradeLevel, string>();
    for (const order of orders) {
      if (order.unlockedGrades) {
        for (const g of order.unlockedGrades) {
          if (!map.has(g)) {
            map.set(g, order.receiptToken);
          }
        }
      }
      for (const item of order.items) {
        if (item.grade && !map.has(item.grade)) {
          map.set(item.grade, order.receiptToken);
        }
      }
    }
    return map;
  }, [orders]);

  function buildGradePack(grade: GradeLevel): GradePackCartItem | null {
    const gradeMaterials = materialsByGrade.get(grade) || [];
    if (gradeMaterials.length === 0) return null;
    return {
      grade,
      title: `Acceso completo — ${grade}`,
      price: GRADE_PACK_PRICE_USD,
      materials: gradeMaterials
    };
  }

  function handleAddGradePackToCart(grade: GradeLevel) {
    const pack = buildGradePack(grade);
    if (!pack) return;
    setCart((prev) => {
      if (prev.some((item) => item.grade === grade)) return prev;
      return [...prev, pack];
    });
  }

  function handleBuyGradePackNow(grade: GradeLevel) {
    const pack = buildGradePack(grade);
    if (!pack) return;
    setSelectedMaterial(null);
    setCart((prev) => (prev.some((item) => item.grade === grade) ? prev : [...prev, pack]));
    setCheckoutOpen(true);
  }

  function handleRemoveGradeFromCart(grade: GradeLevel) {
    setCart((prev) => prev.filter((item) => item.grade !== grade));
  }

  function handleOrderCompleted(order: OrderRecord) {
    setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
    const unlockedSet = new Set<GradeLevel>(order.unlockedGrades || []);
    for (const item of order.items) {
      if (item.grade) unlockedSet.add(item.grade);
    }
    setCart((prev) => prev.filter((pack) => !unlockedSet.has(pack.grade)));
    fetchCatalog();
  }

  function openCreatorFor(tab: StudioTab, grade?: GradeLevel, category?: MaterialCategory) {
    setStudioRequest((prev) => ({
      tab,
      grade,
      category,
      nonce: prev.nonce + 1
    }));
    setMobileMenuOpen(false);
    document.getElementById('creador')?.scrollIntoView({ behavior: 'smooth' });
  }

  function jumpToTab(grade: GradeLevel) {
    setActiveGradeTab(grade);
    setGuideSearch('');
    setSelectedUnitFilter('all');
    setMobileMenuOpen(false);
    document.getElementById('grados')?.scrollIntoView({ behavior: 'smooth' });
  }

  const activeGradeMaterials = materialsByGrade.get(activeGradeTab) || [];
  const activeGradeGuides = useMemo(
    () => activeGradeMaterials.filter((m) => m.category === 'apuntes'),
    [activeGradeMaterials]
  );

  const activeGradeUnits = useMemo(() => {
    const units: string[] = [];
    for (const g of activeGradeGuides) {
      const unitPart = g.durationOrScope.split('·')[0]?.trim();
      if (unitPart && /^unidad\s+/i.test(unitPart) && !units.includes(unitPart)) {
        units.push(unitPart);
      }
    }
    return units;
  }, [activeGradeGuides]);

  const filteredActiveGuides = useMemo(() => {
    const q = guideSearch.trim().toLowerCase();
    return activeGradeGuides.filter((g) => {
      if (selectedUnitFilter !== 'all') {
        const unitPart = g.durationOrScope.split('·')[0]?.trim() || '';
        if (unitPart !== selectedUnitFilter) return false;
      }
      if (!q) return true;
      return (
        g.title.toLowerCase().includes(q) ||
        g.subtitle.toLowerCase().includes(q) ||
        g.previewExcerpt.toLowerCase().includes(q)
      );
    });
  }, [activeGradeGuides, guideSearch, selectedUnitFilter]);

  const extraGradeResources = useMemo(() => {
    const primaryManualId = activeGradeMaterials.find((m) => m.category === 'practicas')?.id;
    const primaryPlanId = activeGradeMaterials.find((m) => m.category === 'planificaciones')?.id;
    return activeGradeMaterials.filter(
      (m) => m.category !== 'apuntes' && m.id !== primaryManualId && m.id !== primaryPlanId
    );
  }, [activeGradeMaterials]);

  const activeGradeSummary = GRADE_SUMMARIES[activeGradeTab];
  const activeGradeInCart = cart.some((item) => item.grade === activeGradeTab);
  const activeGradeUnlockedToken = unlockedTokenByGrade.get(activeGradeTab);
  const isAcademicTab = activeGradeTab === 'Gestión Académica';
  const totalCartUsd = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones, 1 row, gap-8 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
          >
            CIENCIALAB
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#grados"
              onClick={() => {
                if (activeGradeTab === 'Gestión Académica') {
                  setActiveGradeTab('4° Grado');
                  setGuideSearch('');
                  setSelectedUnitFilter('all');
                }
              }}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Por Grado
            </a>
            <button
              type="button"
              onClick={() => jumpToTab('Gestión Académica')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Gestión Académica
            </button>
            <a
              href="#descargas"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Mis Descargas
            </a>
            <a
              href="#creador"
              onClick={() => openCreatorFor('word_studio')}
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Espacio Creador
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Carrito</span>
              <span className="font-mono tabular-nums">
                ({cart.length}
                {totalCartUsd > 0 ? ` · $${totalCartUsd.toFixed(0)}` : ''})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            <a
              href="#grados"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-2 rounded-md hover:bg-slate-50"
            >
              Pestañas por Grado (4° a Bachillerato)
            </a>
            <button
              type="button"
              onClick={() => jumpToTab('Gestión Académica')}
              className="text-left py-2 px-2 rounded-md hover:bg-slate-50 cursor-pointer"
            >
              Gestión Académica (.ZIP)
            </button>
            <a
              href="#descargas"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 px-2 rounded-md hover:bg-slate-50"
            >
              Mis Descargas
            </a>
            <button
              type="button"
              onClick={() => openCreatorFor('word_studio')}
              className="text-left py-2 px-2 rounded-md hover:bg-slate-50 text-teal-800 font-semibold cursor-pointer"
            >
              Espacio Creador (Word y .ZIP)
            </button>
          </nav>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
                <p className="text-xs font-medium text-teal-800">
                  4° Grado a 2° Año Bachillerato + Gestión Académica <span aria-hidden="true">·</span>{' '}
                  {formatUsd(GRADE_PACK_PRICE_USD)} por pestaña
                </p>

                <h1 className="text-[clamp(2.05rem,3.8vw,3.15rem)] font-bold tracking-tight text-slate-900 leading-[1.08] text-balance">
                  Ciencia y Tecnología ordenada en pestañas por grado y lista para descargar.
                </h1>

                <p className="text-base text-slate-600 leading-relaxed max-w-xl">
                  Cada pestaña reúne el manual de laboratorio completo sin desglosar, la planificación del grado y los
                  guiones complementarios de 1 página por práctica (Inicio, Desarrollo y Culminación). El público
                  explora la vista previa en solo lectura y desbloquea todo el grado por{' '}
                  <span className="font-semibold text-slate-900 font-mono">{formatUsd(GRADE_PACK_PRICE_USD)}</span>.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href="#grados"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    Ver pestañas por grado
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => openCreatorFor('academic_zip', 'Gestión Académica', 'folletos')}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Archive className="w-4 h-4 text-teal-700" />
                    Anexar .ZIP (Gestión Académica)
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="h-64 sm:h-72 lg:h-full min-h-[280px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <ResilientImage
                    src={HERO_IMAGE}
                    alt="Materiales de Ciencia y Tecnología por grado escolar y laboratorio"
                    fallbackTitle="CienciaLab Editorial"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Tabbed Grade & Gestión Académica Directory */}
        <section id="grados" className="py-12 lg:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-teal-800 mb-1">
                  Organización curricular completa <span aria-hidden="true">·</span> Visualización general de solo lectura
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Selecciona un grado o Gestión Académica
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">
                Descarga completa por pestaña: <span className="font-mono font-bold text-slate-900">{formatUsd(GRADE_PACK_PRICE_USD)}</span>{' '}
                (PayPal o Tarjeta)
              </p>
            </div>

            {/* Grade Tabs + Gestión Académica Extra Tab */}
            <div
              role="tablist"
              aria-label="Pestañas por grado y Gestión Académica"
              className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/75 rounded-xl"
            >
              {CURRICULUM_GRADES.map((grade) => {
                const isActive = activeGradeTab === grade;
                const count = (materialsByGrade.get(grade) || []).length;
                const isUnlocked = unlockedTokenByGrade.has(grade);

                return (
                  <button
                    key={grade}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => {
                      setActiveGradeTab(grade);
                      setGuideSearch('');
                      setSelectedUnitFilter('all');
                    }}
                    className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span>{grade}</span>
                    <span
                      className={`font-mono tabular-nums text-[11px] ${
                        isUnlocked
                          ? 'text-teal-700 font-bold'
                          : count > 0
                            ? 'text-slate-500'
                            : 'text-slate-400'
                      }`}
                    >
                      {isUnlocked ? '✓' : count}
                    </span>
                  </button>
                );
              })}

              <div className="hidden sm:block w-px h-6 bg-slate-300 mx-0.5 shrink-0" aria-hidden="true" />

              <button
                type="button"
                role="tab"
                aria-selected={activeGradeTab === 'Gestión Académica'}
                onClick={() => {
                  setActiveGradeTab('Gestión Académica');
                  setGuideSearch('');
                  setSelectedUnitFilter('all');
                }}
                className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  activeGradeTab === 'Gestión Académica'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-teal-50 text-teal-900 hover:bg-teal-100 border border-teal-200'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Gestión Académica</span>
                <span className="font-mono tabular-nums text-[11px] opacity-80">
                  {(materialsByGrade.get('Gestión Académica') || []).length}
                </span>
              </button>
            </div>

            {/* Active Tab Panel */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="rounded-xl border border-slate-200 bg-white overflow-hidden animate-pulse p-6 space-y-4">
                    <div className="aspect-[16/10] bg-slate-200 rounded-lg" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-5 bg-slate-200 rounded w-5/6" />
                    <div className="h-4 bg-slate-200 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <div className="p-8 rounded-xl border border-rose-200 bg-rose-50 text-center space-y-3">
                <p className="text-sm font-medium text-rose-800">{loadError}</p>
                <button
                  type="button"
                  onClick={fetchCatalog}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <div role="tabpanel" aria-label={activeGradeTab} className="space-y-6">
                {/* Grade Pack Summary & Purchase Action Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <p className="text-xs font-medium text-teal-800">
                      {activeGradeSummary.stage} <span aria-hidden="true">·</span>{' '}
                      <span className="font-mono tabular-nums">
                        {activeGradeMaterials.length}{' '}
                        {activeGradeMaterials.length === 1 ? 'recurso publicado' : 'recursos publicados'}
                      </span>{' '}
                      <span aria-hidden="true">·</span> Solo lectura pública
                    </p>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{activeGradeTab}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{activeGradeSummary.focus}</p>
                    {!isAcademicTab && (
                      <p className="text-xs text-slate-500 pt-1">
                        Incluye por {formatUsd(GRADE_PACK_PRICE_USD)}:{' '}
                        <span className="text-slate-700 font-medium">01 Manual completo</span>{' '}
                        <span aria-hidden="true">·</span>{' '}
                        <span className="text-slate-700 font-medium">02 Planificación</span>{' '}
                        <span aria-hidden="true">·</span>{' '}
                        <span className="text-slate-700 font-medium">
                          03 {activeGradeGuides.length} Guiones de 1 pág. (Inicio · Desarrollo · Culminación)
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                    {isAcademicTab && (
                      <button
                        type="button"
                        onClick={() => openCreatorFor('academic_zip', 'Gestión Académica', 'folletos')}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Archive className="w-4 h-4 text-teal-700" />
                        Anexar paquete .ZIP
                      </button>
                    )}

                    {activeGradeMaterials.length > 0 ? (
                      activeGradeUnlockedToken ? (
                        <a
                          href="#descargas"
                          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors whitespace-nowrap"
                        >
                          <Check className="w-4 h-4" />
                          Pestaña desbloqueada · Descargar
                        </a>
                      ) : (
                        <div className="flex flex-wrap items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleAddGradePackToCart(activeGradeTab)}
                            disabled={activeGradeInCart}
                            className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                              activeGradeInCart
                                ? 'bg-teal-50 text-teal-800 border border-teal-200 cursor-default'
                                : 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer'
                            }`}
                          >
                            {activeGradeInCart ? (
                              <>
                                <Check className="w-4 h-4" />
                                En carrito
                              </>
                            ) : (
                              'Agregar al carrito'
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleBuyGradePackNow(activeGradeTab)}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Download className="w-4 h-4" />
                            <span>Desbloquear descarga</span>
                            <span className="font-mono tabular-nums">{formatUsd(GRADE_PACK_PRICE_USD)}</span>
                          </button>
                        </div>
                      )
                    ) : (
                      !isAcademicTab && (
                        <button
                          type="button"
                          onClick={() => openCreatorFor('word_studio', activeGradeTab, 'practicas')}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <FilePlus2 className="w-4 h-4" />
                          Adjuntar documentos de {activeGradeTab}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Content View: Gestión Académica Tab vs Curriculum Grade 3-Slot Layout */}
                {isAcademicTab ? (
                  activeGradeMaterials.length === 0 ? (
                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-10 text-center space-y-4">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
                        <Archive className="w-6 h-6" />
                      </div>
                      <div className="max-w-lg mx-auto space-y-1.5">
                        <h4 className="text-base font-bold text-slate-900">
                          Pestaña Gestión Académica lista para paquetes .ZIP
                        </h4>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Aquí puedes anexar archivos comprimidos <span className="font-mono text-slate-800">.zip</span>{' '}
                          con formatos académicos, rúbricas o actas. Los visitantes podrán ver el listado general de
                          archivos en solo lectura y habilitar la descarga por{' '}
                          <span className="font-mono font-semibold text-slate-900">{formatUsd(GRADE_PACK_PRICE_USD)}</span>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCreatorFor('academic_zip', 'Gestión Académica', 'folletos')}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors cursor-pointer"
                      >
                        <Archive className="w-4 h-4" />
                        Anexar primer archivo .ZIP
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {activeGradeMaterials.map((material) => {
                        const unlockedToken =
                          unlockedTokenByMaterialId.get(material.id) || unlockedTokenByGrade.get(material.grade);
                        const downloadHref = unlockedToken
                          ? `/api/download/${encodeURIComponent(material.id)}?token=${encodeURIComponent(unlockedToken)}`
                          : undefined;

                        return (
                          <article
                            key={material.id}
                            className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between"
                          >
                            <div>
                              <button
                                type="button"
                                onClick={() => setSelectedMaterial(material)}
                                className="aspect-[16/10] w-full overflow-hidden bg-slate-100 block text-left cursor-pointer"
                              >
                                <ResilientImage
                                  src={material.coverImage}
                                  alt={material.title}
                                  fallbackTitle={material.title}
                                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
                                />
                              </button>

                              <div className="p-5 space-y-3">
                                <p className="text-xs text-slate-500">
                                  <span className="font-semibold text-teal-800">Gestión Académica</span>{' '}
                                  <span aria-hidden="true">·</span> {material.format}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => setSelectedMaterial(material)}
                                  className="text-left block w-full cursor-pointer"
                                >
                                  <h4 className="text-base font-bold text-slate-900 hover:text-teal-800 transition-colors leading-snug">
                                    {material.title}
                                  </h4>
                                </button>

                                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                                  {material.previewExcerpt}
                                </p>

                                {material.zipEntries && material.zipEntries.length > 0 ? (
                                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                                    <p className="text-[11px] font-semibold text-slate-700">
                                      Vista previa del .ZIP ({material.zipEntries.length} archivos):
                                    </p>
                                    <ul className="space-y-1">
                                      {material.zipEntries.slice(0, 4).map((entry) => (
                                        <li key={entry} className="text-[11px] font-mono text-slate-600 truncate">
                                          • {entry}
                                        </li>
                                      ))}
                                      {material.zipEntries.length > 4 && (
                                        <li className="text-[11px] text-teal-800 font-medium">
                                          +{material.zipEntries.length - 4} archivos más en vista previa...
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                ) : (
                                  material.tableOfContents.length > 0 && (
                                    <ul className="space-y-1 pt-1 text-xs text-slate-600">
                                      {material.tableOfContents.slice(0, 3).map((line) => (
                                        <li key={line} className="truncate">
                                          • {line}
                                        </li>
                                      ))}
                                    </ul>
                                  )
                                )}
                              </div>
                            </div>

                            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
                              <button
                                type="button"
                                onClick={() => setSelectedMaterial(material)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Vista general
                              </button>

                              {downloadHref ? (
                                <a
                                  href={downloadHref}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Descargar
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleBuyGradePackNow('Gestión Académica')}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  Habilitar (${GRADE_PACK_PRICE_USD})
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <div className="space-y-8">
                    {/* Top Row: 01 Manual Completo + 02 Planificación del Grado */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {PRIMARY_GRADE_SLOTS.map((slot) => {
                        const primaryItem = activeGradeMaterials.find((m) => m.category === slot.category);
                        const SlotIcon = slot.icon;

                        if (!primaryItem) {
                          return (
                            <article
                              key={slot.category}
                              className="rounded-xl border border-dashed border-slate-300 bg-white overflow-hidden flex flex-col justify-between"
                            >
                              <div>
                                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
                                    <SlotIcon className="w-3.5 h-3.5 shrink-0" />
                                    <span>
                                      {slot.step} · {slot.heading}
                                    </span>
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500 shrink-0">Listo</span>
                                </div>

                                <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100 relative">
                                  <ResilientImage
                                    src={CATEGORY_IMAGES[slot.category]}
                                    alt={`${slot.heading} — ${activeGradeTab}`}
                                    fallbackTitle={slot.heading}
                                    className="w-full h-full object-cover opacity-55 grayscale-[25%]"
                                  />
                                </div>

                                <div className="p-5 space-y-2.5">
                                  <p className="text-xs text-slate-500">
                                    {activeGradeTab} <span aria-hidden="true">·</span> Espacio curricular reservado
                                  </p>
                                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                                    {slot.heading} — {activeGradeTab}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{slot.emptyHint}</p>
                                </div>
                              </div>

                              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                                <span className="text-xs font-mono text-slate-500">
                                  Tarifa del grado {formatUsd(GRADE_PACK_PRICE_USD)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCreatorFor(
                                      slot.category === 'practicas' ? 'word_studio' : 'publish',
                                      activeGradeTab,
                                      slot.category
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <FilePlus2 className="w-3.5 h-3.5 text-teal-700" />
                                  Adjuntar en Creador
                                </button>
                              </div>
                            </article>
                          );
                        }

                        const unlockedToken =
                          unlockedTokenByMaterialId.get(primaryItem.id) ||
                          unlockedTokenByGrade.get(primaryItem.grade);
                        const downloadHref = unlockedToken
                          ? `/api/download/${encodeURIComponent(primaryItem.id)}?token=${encodeURIComponent(
                              unlockedToken
                            )}`
                          : undefined;
                        const overviewBullets =
                          primaryItem.generalOverviewPoints && primaryItem.generalOverviewPoints.length > 0
                            ? primaryItem.generalOverviewPoints
                            : primaryItem.tableOfContents;

                        return (
                          <article
                            key={primaryItem.id}
                            className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
                          >
                            <div>
                              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
                                  <SlotIcon className="w-3.5 h-3.5 shrink-0" />
                                  <span>
                                    {slot.step} · {slot.heading}
                                  </span>
                                </span>
                                <span className="text-[11px] font-mono tabular-nums text-slate-500 shrink-0">
                                  {primaryItem.pages} {primaryItem.pages === 1 ? 'pág' : 'págs'}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedMaterial(primaryItem)}
                                className="aspect-[16/9] w-full overflow-hidden bg-slate-100 block text-left cursor-pointer"
                              >
                                <ResilientImage
                                  src={primaryItem.coverImage}
                                  alt={primaryItem.title}
                                  fallbackTitle={primaryItem.title}
                                  className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
                                />
                              </button>

                              <div className="p-5 space-y-3">
                                <p className="text-xs text-slate-500 truncate">
                                  {primaryItem.format} <span aria-hidden="true">·</span> {primaryItem.durationOrScope}
                                </p>

                                <button
                                  type="button"
                                  onClick={() => setSelectedMaterial(primaryItem)}
                                  className="text-left block w-full cursor-pointer"
                                >
                                  <h4 className="text-base font-bold text-slate-900 hover:text-teal-800 transition-colors leading-snug">
                                    {primaryItem.title}
                                  </h4>
                                </button>

                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2">
                                  {primaryItem.previewExcerpt}
                                </p>

                                {overviewBullets.length > 0 && (
                                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                    <p className="text-[11px] font-semibold text-slate-700">
                                      Visualización general (solo lectura):
                                    </p>
                                    <ul className="space-y-1">
                                      {overviewBullets.slice(0, 3).map((point) => (
                                        <li key={point} className="text-xs text-slate-600 line-clamp-1">
                                          • {point}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedMaterial(primaryItem)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Vista general
                              </button>

                              {downloadHref ? (
                                <a
                                  href={downloadHref}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Descargar
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleBuyGradePackNow(activeGradeTab)}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  Incluido (${GRADE_PACK_PRICE_USD})
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    {/* Section 03: Material Complementario por Práctica (Guiones Breves de 1 Página · Inicio, Desarrollo y Culminación) */}
                    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
                            <BookOpen className="w-4 h-4 shrink-0" />
                            <span>
                              03 · Material Complementario por Práctica ({activeGradeGuides.length} Guiones de 1 Página)
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-slate-900">
                            Guiones breves de Inicio, Desarrollo y Culminación — {activeGradeTab}
                          </h4>
                          <p className="text-xs text-slate-600">
                            Un guion práctico de 1 página por cada experimento del manual para orientar la teoría antes
                            y durante la clase. Todos se desbloquean al adquirir el paquete del grado ({formatUsd(GRADE_PACK_PRICE_USD)}).
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                          {activeGradeUnits.length > 0 && (
                            <select
                              value={selectedUnitFilter}
                              onChange={(e) => setSelectedUnitFilter(e.target.value)}
                              aria-label="Filtrar guiones por unidad"
                              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                            >
                              <option value="all">Todas las unidades ({activeGradeGuides.length})</option>
                              {activeGradeUnits.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          )}

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="search"
                              value={guideSearch}
                              onChange={(e) => setGuideSearch(e.target.value)}
                              placeholder="Buscar práctica o tema..."
                              aria-label="Buscar guion por tema o número de práctica"
                              className="w-full sm:w-56 pl-8 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                            />
                          </div>
                        </div>
                      </div>

                      {filteredActiveGuides.length === 0 ? (
                        <div className="py-8 text-center space-y-2">
                          <p className="text-sm font-semibold text-slate-800">
                            No se encontraron guiones con ese filtro en {activeGradeTab}.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setGuideSearch('');
                              setSelectedUnitFilter('all');
                            }}
                            className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
                          >
                            Mostrar los {activeGradeGuides.length} guiones del grado
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredActiveGuides.map((guide) => {
                            const unlockedToken =
                              unlockedTokenByMaterialId.get(guide.id) || unlockedTokenByGrade.get(guide.grade);
                            const downloadHref = unlockedToken
                              ? `/api/download/${encodeURIComponent(guide.id)}?token=${encodeURIComponent(
                                  unlockedToken
                                )}`
                              : undefined;
                            const unitLabel = guide.durationOrScope.split('·')[0]?.trim() || guide.grade;
                            const overviewPoints =
                              guide.generalOverviewPoints && guide.generalOverviewPoints.length > 0
                                ? guide.generalOverviewPoints
                                : [];

                            return (
                              <article
                                key={guide.id}
                                className="rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between p-4 space-y-3"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2 text-[11px]">
                                    <span className="font-semibold text-teal-800 truncate">{unitLabel}</span>
                                    <span className="font-mono text-slate-500 shrink-0">1 pág.</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedMaterial(guide)}
                                    className="text-left block w-full cursor-pointer"
                                  >
                                    <h5 className="text-sm font-bold text-slate-900 hover:text-teal-800 transition-colors leading-snug">
                                      {guide.title}
                                    </h5>
                                  </button>

                                  {overviewPoints.length > 0 ? (
                                    <ul className="space-y-1 pt-1 text-[11px] text-slate-600 leading-relaxed">
                                      {overviewPoints.slice(0, 3).map((pt, i) => (
                                        <li key={i} className="line-clamp-2">
                                          • {pt}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-xs text-slate-600 line-clamp-3">{guide.previewExcerpt}</p>
                                  )}
                                </div>

                                <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMaterial(guide)}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Vista general
                                  </button>

                                  {downloadHref ? (
                                    <a
                                      href={downloadHref}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold whitespace-nowrap"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      Descargar PDF
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleBuyGradePackNow(activeGradeTab)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                                    >
                                      <Lock className="w-3 h-3" />
                                      Incluido (${GRADE_PACK_PRICE_USD})
                                    </button>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Additional materials uploaded in the same grade tab (excluding primary manual/plan & complementary guides) */}
                    {extraGradeResources.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
                        <h4 className="text-sm font-bold text-slate-900">
                          Recursos adicionales en {activeGradeTab}
                        </h4>
                        <div className="divide-y divide-slate-100">
                          {extraGradeResources.map((extra) => {
                            const unlockedToken =
                              unlockedTokenByMaterialId.get(extra.id) || unlockedTokenByGrade.get(extra.grade);
                            return (
                              <div
                                key={extra.id}
                                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{extra.title}</p>
                                  <p className="text-xs text-slate-500">
                                    {extra.format} · {extra.pages} págs · {extra.durationOrScope}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedMaterial(extra)}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                  >
                                    Vista general
                                  </button>
                                  {unlockedToken ? (
                                    <a
                                      href={`/api/download/${encodeURIComponent(extra.id)}?token=${encodeURIComponent(
                                        unlockedToken
                                      )}`}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      Descargar
                                    </a>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleBuyGradePackNow(activeGradeTab)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                      Incluido (${GRADE_PACK_PRICE_USD})
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Buyer Downloads Vault & Recovery */}
        <DownloadsVault
          orders={orders}
          onRecoveredOrder={(recovered) =>
            setOrders((prev) => [recovered, ...prev.filter((o) => o.id !== recovered.id)])
          }
        />

        {/* Creator Admin Workspace, Word Library & Gestión Académica .ZIP */}
        <CreatorStudio
          authToken={adminToken}
          requestedTab={studioRequest.tab}
          requestedGrade={studioRequest.grade}
          requestedCategory={studioRequest.category}
          requestNonce={studioRequest.nonce}
          onAuthTokenChange={setAdminToken}
          onCatalogMutated={fetchCatalog}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-800">CIENCIALAB</p>
            <p className="mt-1">
              Materiales de Ciencia y Tecnología por grado (4° Grado a 2° Año Bachillerato) y Gestión Académica (.ZIP) a{' '}
              {formatUsd(GRADE_PACK_PRICE_USD)} por pestaña.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#grados" className="hover:text-slate-900 transition-colors">
              Pestañas por Grado
            </a>
            <button
              type="button"
              onClick={() => jumpToTab('Gestión Académica')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Gestión Académica
            </button>
            <a href="#descargas" className="hover:text-slate-900 transition-colors">
              Mis Descargas
            </a>
            <a
              href="#creador"
              onClick={() => openCreatorFor('word_studio')}
              className="hover:text-slate-900 transition-colors"
            >
              Espacio Creador
            </a>
          </div>
        </div>
      </footer>

      {/* Read-Only Public General Preview Modal */}
      <MaterialDetailModal
        material={selectedMaterial}
        inCart={selectedMaterial ? cart.some((item) => item.grade === selectedMaterial.grade) : false}
        unlockedToken={
          selectedMaterial
            ? unlockedTokenByMaterialId.get(selectedMaterial.id) || unlockedTokenByGrade.get(selectedMaterial.grade)
            : undefined
        }
        onClose={() => setSelectedMaterial(null)}
        onAddGradePackToCart={handleAddGradePackToCart}
        onBuyGradePackNow={handleBuyGradePackNow}
      />

      {/* Slide-Over Grade Pack Cart & Payment Drawer */}
      <CheckoutDrawer
        open={checkoutOpen}
        cart={cart}
        paymentConfig={paymentConfig}
        onClose={() => setCheckoutOpen(false)}
        onRemoveGrade={handleRemoveGradeFromCart}
        onOrderCompleted={handleOrderCompleted}
      />
    </div>
  );
}

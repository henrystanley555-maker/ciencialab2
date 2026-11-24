import { Archive, Check, Download, Eye, FileText, Lock, ShoppingBag, X } from 'lucide-react';
import { CATEGORY_LABELS, GRADE_PACK_PRICE_USD, formatUsd } from '../constants.ts';
import type { GradeLevel, MaterialPublic } from '../types.ts';
import { ResilientImage } from './ResilientImage.tsx';

interface MaterialDetailModalProps {
  material: MaterialPublic | null;
  inCart: boolean;
  unlockedToken?: string;
  onClose: () => void;
  onAddGradePackToCart: (grade: GradeLevel) => void;
  onBuyGradePackNow: (grade: GradeLevel) => void;
}

export function MaterialDetailModal({
  material,
  inCart,
  unlockedToken,
  onClose,
  onAddGradePackToCart,
  onBuyGradePackNow
}: MaterialDetailModalProps) {
  if (!material) return null;

  const isUnlocked = Boolean(unlockedToken);
  const downloadHref = unlockedToken
    ? `/api/download/${encodeURIComponent(material.id)}?token=${encodeURIComponent(unlockedToken)}`
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-material-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar vista previa"
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-lg bg-white/95 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left column: Visual, Specs & Grade Pack CTA */}
          <div className="lg:col-span-5 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-6 flex flex-col justify-between gap-6">
            <div>
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-slate-200 bg-white">
                <ResilientImage
                  src={material.coverImage}
                  alt={material.title}
                  fallbackTitle={material.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <dl className="mt-6 space-y-3 text-sm border-t border-slate-200 pt-5">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Pestaña / Grado</dt>
                  <dd className="font-semibold text-teal-800 text-right">{material.grade}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Tipo de recurso</dt>
                  <dd className="font-medium text-slate-900 text-right">{CATEGORY_LABELS[material.category]}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Formato del archivo</dt>
                  <dd className="font-medium text-slate-900 text-right">{material.format}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Extensión</dt>
                  <dd className="font-mono tabular-nums text-slate-900 text-right">
                    {material.pages === 1 ? '1 página general' : `${material.pages} págs`}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Alcance</dt>
                  <dd className="font-medium text-slate-900 text-right">{material.durationOrScope}</dd>
                </div>
              </dl>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">Paquete completo ({material.grade})</span>
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {formatUsd(GRADE_PACK_PRICE_USD)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Un único pago de {formatUsd(GRADE_PACK_PRICE_USD)} desbloquea y permite descargar todo el material incluido en {material.grade}.
              </p>

              {isUnlocked && downloadHref ? (
                <a
                  href={downloadHref}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Descargar archivo ahora
                </a>
              ) : (
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => onBuyGradePackNow(material.grade)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Desbloquear {material.grade} ({formatUsd(GRADE_PACK_PRICE_USD)})
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddGradePackToCart(material.grade)}
                    disabled={inCart}
                    className={`w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border text-sm font-medium transition-colors whitespace-nowrap ${
                      inCart
                        ? 'border-teal-200 bg-teal-50 text-teal-800 cursor-default'
                        : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 cursor-pointer'
                    }`}
                  >
                    {inCart ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                    {inCart ? 'Paquete en carrito' : 'Agregar paquete del grado'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Read-Only General Public Visualization */}
          <div className="lg:col-span-7 p-6 sm:p-8 space-y-6 select-none">
            <div className="flex items-center gap-2 text-xs font-medium text-teal-800">
              <Eye className="w-4 h-4 shrink-0" />
              <span>Visualización general para el público · Solo lectura</span>
              {!isUnlocked && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Lock className="w-3.5 h-3.5" />
                    Descarga protegida
                  </span>
                </>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-slate-500 mb-1.5">
                {material.grade} <span aria-hidden="true">·</span> {CATEGORY_LABELS[material.category]}
              </p>
              <h2 id="modal-material-title" className="text-2xl font-bold text-slate-900 leading-tight text-balance">
                {material.title}
              </h2>
              <p className="mt-2 text-base text-slate-600 leading-relaxed">{material.subtitle}</p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Panorama general del documento</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{material.previewExcerpt}</p>
            </div>

            {material.generalOverviewPoints && material.generalOverviewPoints.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Contenido general cubierto</h3>
                <ul className="space-y-2">
                  {material.generalOverviewPoints.map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {material.zipEntries && material.zipEntries.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Archive className="w-4 h-4 text-teal-700" />
                  Archivos incluidos dentro del paquete .ZIP ({material.zipEntries.length})
                </h3>
                <ul className="max-h-44 overflow-y-auto space-y-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                  {material.zipEntries.map((entry, idx) => (
                    <li key={idx} className="truncate">
                      {entry}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {material.objectives.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Propósitos de aprendizaje</h3>
                <ul className="space-y-2">
                  {material.objectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {material.tableOfContents.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Estructura incluida al descargar</h3>
                <ul className="space-y-2">
                  {material.tableOfContents.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

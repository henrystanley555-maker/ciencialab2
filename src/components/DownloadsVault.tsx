import { useState, type FormEvent } from 'react';
import { Download, Search } from 'lucide-react';
import { CATEGORY_LABELS, GRADE_PACK_PRICE_USD, formatUsd } from '../constants.ts';
import type { OrderRecord } from '../types.ts';

interface DownloadsVaultProps {
  orders: OrderRecord[];
  onRecoveredOrder: (order: OrderRecord) => void;
}

export function DownloadsVault({ orders, onRecoveredOrder }: DownloadsVaultProps) {
  const [orderCode, setOrderCode] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleRecover(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/orders/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderCode, buyerEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo recuperar la orden.');
      }
      onRecoveredOrder(data.order);
      setSuccessMsg(`Orden ${data.order.orderCode} recuperada con éxito.`);
      setOrderCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error consultando orden.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="descargas" className="py-16 border-t border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-balance">
              Biblioteca de descargas y recuperación
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Los documentos públicos son de visualización general. Al completar el pago de{' '}
              {formatUsd(GRADE_PACK_PRICE_USD)} por grado o Gestión Académica, todos sus archivos se desbloquean aquí.
            </p>

            <form onSubmit={handleRecover} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3.5">
              <h3 className="text-sm font-semibold text-slate-900">Recuperar compra anterior</h3>
              <div>
                <label htmlFor="recover-code" className="block text-xs font-medium text-slate-700 mb-1">
                  Código de orden
                </label>
                <input
                  id="recover-code"
                  type="text"
                  required
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="Ej. CL-2026-A1B2C3"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
              <div>
                <label htmlFor="recover-email" className="block text-xs font-medium text-slate-700 mb-1">
                  Correo de compra
                </label>
                <input
                  id="recover-email"
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="docente@institucion.edu"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              {error && <p className="text-xs text-rose-700">{error}</p>}
              {successMsg && <p className="text-xs text-teal-800 font-medium">{successMsg}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? 'Buscando...' : 'Buscar mis archivos'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7">
            {orders.length === 0 ? (
              <div className="p-8 rounded-xl border border-slate-200 bg-slate-50/60 text-center space-y-2">
                <p className="text-base font-semibold text-slate-900">Aún no tienes descargas desbloqueadas</p>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Cuando adquieras el paquete de cualquier grado o Gestión Académica ({formatUsd(GRADE_PACK_PRICE_USD)}{' '}
                  por pestaña), tus enlaces directos de descarga aparecerán aquí.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <p className="text-xs font-mono text-teal-800 font-semibold">{order.orderCode}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {order.buyerName} · {order.buyerEmail} ·{' '}
                          {new Date(order.createdAt).toLocaleDateString('es-ES')}
                        </p>
                        {order.unlockedGrades && order.unlockedGrades.length > 0 && (
                          <p className="text-xs text-slate-600 mt-0.5">
                            Grados desbloqueados: {order.unlockedGrades.join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                        {formatUsd(order.totalAmount)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-600">
                        {order.items.length} archivos incluidos en esta compra:
                      </p>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {order.items.map((item) => (
                          <div
                            key={item.materialId}
                            className="flex items-center justify-between gap-4 py-2 px-3 rounded-lg bg-slate-50"
                          >
                            <div className="min-w-0">
                              <p className="text-xs text-slate-500">
                                {item.grade ? `${item.grade} · ` : ''}
                                {CATEGORY_LABELS[item.category]} · {item.format}
                              </p>
                              <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                            </div>
                            <a
                              href={`/api/download/${encodeURIComponent(item.materialId)}?token=${encodeURIComponent(
                                order.receiptToken
                              )}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors shrink-0 whitespace-nowrap"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Descargar
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

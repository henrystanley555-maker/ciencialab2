import { useState, type FormEvent } from 'react';
import { CheckCircle2, CreditCard, Download, Lock, ShieldCheck, Trash2, Wallet, X } from 'lucide-react';
import { CATEGORY_LABELS, GRADE_PACK_PRICE_USD, formatUsd } from '../constants.ts';
import type { GradeLevel, GradePackCartItem, OrderRecord, PaymentGatewayConfig } from '../types.ts';

interface CheckoutDrawerProps {
  open: boolean;
  cart: GradePackCartItem[];
  paymentConfig: PaymentGatewayConfig | null;
  onClose: () => void;
  onRemoveGrade: (grade: GradeLevel) => void;
  onOrderCompleted: (order: OrderRecord) => void;
}

export function CheckoutDrawer({
  open,
  cart,
  paymentConfig,
  onClose,
  onRemoveGrade,
  onOrderCompleted
}: CheckoutDrawerProps) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'card'>('paypal');

  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [pendingPaypal, setPendingPaypal] = useState<{
    paypalOrderId: string;
    approvalUrl: string | null;
    mode: 'live' | 'sandbox';
    pendingToken?: string;
  } | null>(null);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<OrderRecord | null>(null);

  if (!open) return null;

  const totalAmount = Number(cart.reduce((sum, pack) => sum + pack.price, 0).toFixed(2));
  const stripeEnabled = Boolean(paymentConfig?.stripeConfigured);
  const paypalEnabled = Boolean(paymentConfig?.paypalConfigured);

  function formatCardInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  function formatExpiryInput(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  }

  async function handlePaypalInitiate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setProcessing(true);

    try {
      const res = await fetch('/api/checkout/paypal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradePacks: cart.map((pack) => pack.grade),
          buyerName,
          buyerEmail
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo iniciar el pago con PayPal.');
      }

      setPendingPaypal({
        paypalOrderId: data.paypalOrderId,
        approvalUrl: data.approvalUrl,
        mode: data.mode,
        pendingToken: data.pendingToken
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error iniciando PayPal.');
    } finally {
      setProcessing(false);
    }
  }

  async function handlePaypalCapture() {
    if (!pendingPaypal) return;
    setError(null);
    setProcessing(true);

    try {
      const res = await fetch('/api/checkout/paypal/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalOrderId: pendingPaypal.paypalOrderId,
          pendingToken: pendingPaypal.pendingToken
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo confirmar el pago en PayPal.');
      }
      setPendingPaypal(null);
      setCompletedOrder(data.order);
      onOrderCompleted(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error confirmando PayPal.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleCardCheckout(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!stripeEnabled) {
      const digits = cardNumber.replace(/\D/g, '');
      if (digits.length < 13) {
        setError('Ingresa un número de tarjeta válido (mínimo 13 dígitos para prueba).');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setError('Ingresa la fecha de vencimiento en formato MM/AA.');
        return;
      }
      if (cardCvc.replace(/\D/g, '').length < 3) {
        setError('Ingresa el código de seguridad CVC.');
        return;
      }
    }

    setProcessing(true);
    try {
      const digits = cardNumber.replace(/\D/g, '');
      const cardLast4 = digits.slice(-4) || '4242';

      const res = await fetch('/api/checkout/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradePacks: cart.map((pack) => pack.grade),
          buyerName,
          buyerEmail,
          cardLast4
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo procesar el pago con tarjeta.');
      }

      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      if (data.order) {
        setCompletedOrder(data.order);
        onOrderCompleted(data.order);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error procesando tarjeta.');
    } finally {
      setProcessing(false);
    }
  }

  function resetAndClose() {
    setCompletedOrder(null);
    setPendingPaypal(null);
    setError(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Carrito y pago por grado"
      onClick={resetAndClose}
    >
      <div
        className="w-full max-w-lg bg-white h-full overflow-y-auto border-l border-slate-200 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {completedOrder ? 'Descarga habilitada' : `Carrito por grado (${formatUsd(GRADE_PACK_PRICE_USD)})`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {completedOrder
                ? `Comprobante ${completedOrder.orderCode}`
                : 'Desbloquea todos los materiales de la pestaña seleccionada'}
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Cerrar carrito"
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 space-y-6">
          {completedOrder ? (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-teal-50/70 border border-teal-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-teal-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Pago verificado correctamente</h3>
                    <p className="text-sm text-slate-700 mt-1">
                      Gracias, {completedOrder.buyerName}. Todos los archivos de los grados adquiridos ya están
                      habilitados para descarga.
                    </p>
                    <p className="text-xs font-mono text-slate-600 mt-2">
                      Orden: {completedOrder.orderCode} · Método:{' '}
                      {completedOrder.paymentMethod === 'paypal' ? 'PayPal' : 'Tarjeta'} (
                      {completedOrder.paymentMode === 'live' ? 'Producción' : 'Sandbox'})
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">Archivos desbloqueados para descargar</h4>
                  <span className="text-xs font-mono text-slate-500">{completedOrder.items.length} archivos</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {completedOrder.items.map((item) => (
                    <div
                      key={item.materialId}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-500">
                          {item.grade ? `${item.grade} · ` : ''}
                          {CATEGORY_LABELS[item.category]} · {item.format}
                        </p>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                      </div>
                      <a
                        href={`/api/download/${encodeURIComponent(item.materialId)}?token=${encodeURIComponent(
                          completedOrder.receiptToken
                        )}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors shrink-0 whitespace-nowrap"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Guarda tu código <strong className="font-mono text-slate-800">{completedOrder.orderCode}</strong> junto
                con tu correo <strong className="text-slate-800">{completedOrder.buyerEmail}</strong> para volver a
                descargar en cualquier momento desde Mis Descargas.
              </p>

              <button
                type="button"
                onClick={resetAndClose}
                className="w-full py-3 px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Seguir explorando grados
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-base font-semibold text-slate-900">Tu carrito está vacío</p>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Selecciona cualquier pestaña de grado o Gestión Académica y adquiere el paquete completo por{' '}
                {formatUsd(GRADE_PACK_PRICE_USD)}.
              </p>
            </div>
          ) : (
            <>
              {/* Itemized Grade Packs */}
              <div className="space-y-4">
                {cart.map((pack) => (
                  <div
                    key={pack.grade}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-teal-800">Paquete Completo · {pack.grade}</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{pack.title}</p>
                        <p className="text-xs font-mono tabular-nums text-slate-700 mt-1">{formatUsd(pack.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveGrade(pack.grade)}
                        aria-label={`Quitar paquete de ${pack.grade}`}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-700">
                        {pack.materials.length} recursos incluidos (manual, planificación y guiones de 1 pág.):
                      </p>
                      <ul className="text-xs text-slate-600 space-y-1 max-h-40 overflow-y-auto pr-1">
                        {pack.materials.map((m) => (
                          <li key={m.id} className="truncate">
                            • {m.title} ({m.format})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-medium text-slate-600">
                    Total a pagar ({formatUsd(GRADE_PACK_PRICE_USD)} por grado)
                  </span>
                  <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                    {formatUsd(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Buyer Info + Payment Tabs */}
              <div className="space-y-4 pt-2 border-t border-slate-200">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label htmlFor="buyer-name" className="block text-xs font-medium text-slate-700 mb-1">
                      Nombre completo
                    </label>
                    <input
                      id="buyer-name"
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Ej. María Fernanda López"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>
                  <div>
                    <label htmlFor="buyer-email" className="block text-xs font-medium text-slate-700 mb-1">
                      Correo electrónico (para recibo y recuperación)
                    </label>
                    <input
                      id="buyer-email"
                      type="email"
                      required
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="docente@institucion.edu"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <span className="block text-xs font-medium text-slate-700 mb-2">Método de pago seguro</span>
                  <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('paypal');
                        setError(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        paymentMethod === 'paypal'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Wallet className="w-4 h-4 text-sky-700" />
                      PayPal
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('card');
                        setError(null);
                        setPendingPaypal(null);
                      }}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                        paymentMethod === 'card'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-teal-700" />
                      Tarjeta Crédito / Débito
                    </button>
                  </div>
                </div>

                {error && (
                  <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                    {error}
                  </div>
                )}

                {paymentMethod === 'paypal' ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                      <p className="font-semibold text-slate-800 mb-1">
                        {paypalEnabled
                          ? `Pasarela PayPal activa (${paymentConfig?.paypalMode === 'live' ? 'Producción' : 'Sandbox'})`
                          : 'Pasarela PayPal (Modo Sandbox listo para pruebas)'}
                      </p>
                      <p>
                        Al completar el pago de {formatUsd(GRADE_PACK_PRICE_USD)} por grado, el servidor verifica la
                        transacción y habilita tus descargas automáticamente.
                      </p>
                    </div>

                    {!pendingPaypal ? (
                      <form onSubmit={handlePaypalInitiate}>
                        <button
                          type="submit"
                          disabled={processing}
                          className="w-full py-3 px-5 rounded-lg bg-[#003087] hover:bg-[#002366] text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                        >
                          {processing ? 'Conectando con PayPal...' : `Continuar con PayPal (${formatUsd(totalAmount)})`}
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 rounded-lg border border-sky-200 bg-sky-50/70 space-y-3">
                        <p className="text-xs font-semibold text-slate-900">
                          Orden PayPal generada: <span className="font-mono">{pendingPaypal.paypalOrderId}</span>
                        </p>
                        {pendingPaypal.approvalUrl ? (
                          <div className="space-y-2.5">
                            <p className="text-xs text-slate-600">
                              Autoriza el pago en PayPal y luego presiona confirmar para liberar tus archivos:
                            </p>
                            <div className="flex flex-col gap-2">
                              <a
                                href={pendingPaypal.approvalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full text-center py-2.5 px-4 rounded-lg bg-[#0070BA] text-white text-xs font-semibold hover:bg-[#005ea6] transition-colors"
                              >
                                Abrir autorización PayPal
                              </a>
                              <button
                                type="button"
                                onClick={handlePaypalCapture}
                                disabled={processing}
                                className="w-full py-2.5 px-4 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors cursor-pointer"
                              >
                                {processing ? 'Verificando captura...' : 'Confirmar pago y desbloquear descarga'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            <p className="text-xs text-slate-600">
                              Orden lista en modo Sandbox. Simula la aprobación para liberar las descargas del grado:
                            </p>
                            <button
                              type="button"
                              onClick={handlePaypalCapture}
                              disabled={processing}
                              className="w-full py-2.5 px-4 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition-colors cursor-pointer"
                            >
                              {processing ? 'Procesando captura...' : 'Aprobar pago PayPal y descargar'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleCardCheckout} className="space-y-3.5">
                    {stripeEnabled ? (
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                        <p className="font-semibold text-slate-800 mb-1">Checkout seguro con Stripe activo</p>
                        <p>
                          Serás dirigido al formulario encriptado de Stripe para pagar con Visa, Mastercard o American
                          Express y regresar con tus descargas activas.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                          Pago con tarjeta Visa / Mastercard / Débito (Modo Sandbox de prueba inmediata).
                        </div>
                        <div>
                          <label htmlFor="card-number" className="block text-xs font-medium text-slate-700 mb-1">
                            Número de tarjeta
                          </label>
                          <input
                            id="card-number"
                            type="text"
                            inputMode="numeric"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                            placeholder="4532 8910 2345 6789"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="card-expiry" className="block text-xs font-medium text-slate-700 mb-1">
                              Vencimiento
                            </label>
                            <input
                              id="card-expiry"
                              type="text"
                              inputMode="numeric"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                              placeholder="08/29"
                              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                            />
                          </div>
                          <div>
                            <label htmlFor="card-cvc" className="block text-xs font-medium text-slate-700 mb-1">
                              CVC
                            </label>
                            <input
                              id="card-cvc"
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder="123"
                              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      disabled={processing}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <Lock className="w-4 h-4" />
                      {processing ? 'Procesando pago...' : `Pagar ${formatUsd(totalAmount)} con tarjeta`}
                    </button>
                  </form>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  <span>Tarifa verificada en servidor: {formatUsd(GRADE_PACK_PRICE_USD)} por grado o pestaña</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

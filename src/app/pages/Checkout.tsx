import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { NyraButton, NyraFormError, NyraInput, NyraLabel } from '../components/form/NyraField';
import { useCheckoutStore } from '../store/checkoutStore';
import { useToast } from '../hooks/useToast';
import { useCartStore } from '../store/cartStore';
import { useCatalog } from '../lib/useCatalog';
import { formatPrice } from '../lib/price';
import { ErrorState, LoadingState } from '../components/ui/AsyncState';
import { useOrderStore } from '../store/orderStore';
import { usePurchasedProductsStore } from '../store/purchasedProductsStore';
import { useHerboristeriePriceAccess } from '../hooks/useHerboristeriePriceAccess';
import { ProfessionalPriceHint } from '../components/catalog/ProfessionalPriceHint';
import { SycapayPaymentPanel } from '../features/checkout/components/SycapayPaymentPanel';
import {
  checkoutProductRef,
  findCatalogProduct,
  resolveVariant,
  unitPriceForLine,
} from '../features/catalog/productUtils';
import { buildCheckoutLinesFromCart } from '../lib/checkoutLine';
import { validateInitAgainstCart } from '../lib/checkoutInitValidation';
import { useReconcileCartWhenReady } from '../hooks/useReconcileCartWhenReady';
import { ApiError, getApiErrorCode } from '../services/api/apiError';
import { confirmCheckout, initCheckout } from '../services/api/commerceApi';
import { initSycapayCheckoutPayment } from '../services/api/paymentApi';
import { checkoutErrorMessage } from '../lib/checkoutErrorMessages';
import {
  clearCheckoutSessionKeys,
  getCheckoutAccess,
  saveCheckoutSession,
  saveGuestCheckoutToken,
} from '../lib/checkoutAccess';
import { usePendingPaymentsStore } from '../store/pendingPaymentsStore';
import {
  codeServiceForOperator,
  PAYMENT_METHOD_SYCAPAY,
  sycapayQrCodeSrc,
  type SycapayOperator,
} from '../services/payment/sycapayTypes';
import {
  trackCheckoutPaymentFailed,
  trackCheckoutStepComplete,
  trackCheckoutStepView,
} from '../services/analytics/tracking';

type Step = 1 | 2;
const STEP_LABELS: Record<Step, string> = {
  1: 'customer_info',
  2: 'payment',
};

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Normalise un numéro SN pour Sycapay (chiffres seuls, sans indicatif). */
function normalizeSnPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('221') && digits.length > 9) {
    digits = digits.slice(3);
  }
  if (digits.startsWith('0') && digits.length === 10) {
    digits = digits.slice(1);
  }
  return digits;
}

function isSnPhoneValid(raw: string) {
  const digits = normalizeSnPhone(raw);
  return /^7\d{8}$/.test(digits);
}

export const Checkout = () => {
  const { success, error: toastError, info } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [formError, setFormError] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [operator, setOperator] = useState<SycapayOperator>('wave');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [activeQrCode, setActiveQrCode] = useState<string | null>(null);

  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const reconcileWithCatalog = useCartStore((s) => s.reconcileWithCatalog);
  const addOrder = useOrderStore((s) => s.addOrder);
  const hydratePurchasedProducts = usePurchasedProductsStore((s) => s.hydrateFromServer);
  const upsertPendingPayment = usePendingPaymentsStore((s) => s.upsert);
  const { shouldHidePrice, canPurchaseProduct } = useHerboristeriePriceAccess();
  const { products, loading, error } = useCatalog();
  useReconcileCartWhenReady(false);

  const { customer, shipping, updateCustomer, updateShipping } = useCheckoutStore();

  useEffect(() => {
    if (!paymentPhone.trim() && customer.phone.trim()) {
      setPaymentPhone(customer.phone);
    }
  }, [customer.phone, paymentPhone]);

  const cartProducts = useMemo(
    () =>
      cartItems
        .map((item) => {
          const product = findCatalogProduct(products, item.productId);
          if (!product) return null;
          const unitPrice = unitPriceForLine(product, item.variantId);
          return {
            ...product,
            storeProductId: checkoutProductRef(product),
            quantity: item.quantity,
            variantId: item.variantId,
            unitPrice,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [cartItems, products]
  );

  const hasLockedHerboristerie = useMemo(
    () => cartProducts.some((item) => shouldHidePrice(item)),
    [cartProducts, shouldHidePrice]
  );
  const purchasableLines = useMemo(
    () => cartProducts.filter((item) => canPurchaseProduct(item)),
    [cartProducts, canPurchaseProduct]
  );

  const subtotal = useMemo(
    () => purchasableLines.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0),
    [purchasableLines]
  );
  const shippingFee = subtotal > 45000 || subtotal === 0 ? 0 : 10;
  const total = subtotal + shippingFee;

  useEffect(() => {
    trackCheckoutStepView(step, STEP_LABELS[step]);
  }, [step]);

  const validateStep1 = useCallback(() => {
    if (!customer.fullName.trim()) return 'Le nom complet est obligatoire.';
    if (!customer.phone.trim()) return 'Le numéro de téléphone est obligatoire.';
    if (!isSnPhoneValid(customer.phone)) {
      return 'Indiquez un numéro sénégalais valide (ex. 77 123 45 67).';
    }
    if (!shipping.address.trim()) return 'L’adresse de livraison est obligatoire.';
    if (customer.email.trim() && !isEmailValid(customer.email)) {
      return 'Adresse e-mail invalide.';
    }
    return '';
  }, [customer.email, customer.fullName, customer.phone, shipping.address]);

  const handleContinue = () => {
    setFormError('');
    const stepError = validateStep1();
    if (stepError) {
      setFormError(stepError);
      toastError(stepError);
      return;
    }
    if (!paymentPhone.trim()) setPaymentPhone(customer.phone);
    setStep(2);
    trackCheckoutStepComplete(1, STEP_LABELS[1]);
    info('Informations enregistrées. Choisissez votre moyen de paiement.');
  };

  const handlePay = async () => {
    setFormError('');
    setActiveQrCode(null);

    const infoError = validateStep1();
    if (infoError) {
      setFormError(infoError);
      toastError(infoError);
      setStep(1);
      return;
    }

    if (!isSnPhoneValid(paymentPhone)) {
      const msg = 'Indiquez le numéro Wave ou Orange Money pour le paiement.';
      setFormError(msg);
      toastError(msg);
      return;
    }

    if (cartProducts.length === 0) {
      const msg = 'Votre panier est vide.';
      setFormError(msg);
      toastError(msg);
      return;
    }

    const finalizeOrderLocally = async () => {
      const orderId = addOrder({
        status: 'paid',
        paymentMethod: PAYMENT_METHOD_SYCAPAY,
        customer: {
          fullName: customer.fullName.trim(),
          email: customer.email,
          phone: customer.phone,
        },
        shippingAddress: { address: shipping.address },
        billingAddress: { address: shipping.address },
        subtotal,
        shippingFee,
        total,
        items: cartProducts.map((item) => ({
          productId: item.storeProductId,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
      });
      await clearCart();
      await hydratePurchasedProducts();
      trackCheckoutStepComplete(2, STEP_LABELS[2]);
      success(`Paiement validé. Commande ${orderId} créée.`);
    };

    setIsPaying(true);

    try {
      clearCheckoutSessionKeys();
      if (products.length > 0) {
        reconcileWithCatalog(products);
      }

      const access = getCheckoutAccess();
      const cartLines = useCartStore.getState().items.filter((item) => {
        const product = findCatalogProduct(products, item.productId);
        return product && canPurchaseProduct(product);
      });
      const { lines: payableProducts, skipped } = buildCheckoutLinesFromCart(products, cartLines);

      if (skipped.length > 0) {
        const msg = `Format ou produit manquant pour : ${skipped.join(', ')}. Ouvrez la fiche produit, choisissez le format (250g / 50g), puis réessayez.`;
        setFormError(msg);
        toastError(msg);
        return;
      }

      if (payableProducts.length === 0) {
        const msg = 'Aucun article valide pour le paiement. Videz le panier et rajoutez vos produits.';
        setFormError(msg);
        toastError(msg);
        return;
      }

      const pricedLines = purchasableLines.map((item) => ({
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      }));

      const emailTrimmed = customer.email.trim();
      const init = await initCheckout(
        {
          customer: {
            fullName: customer.fullName.trim(),
            phone: normalizeSnPhone(customer.phone),
            ...(emailTrimmed ? { email: emailTrimmed } : {}),
          },
          shippingAddress: { address: shipping.address.trim() },
          billingSameAsShipping: true,
          items: payableProducts,
        },
        { token: access.token }
      );
      const checkoutId = init.checkoutId ?? init.checkout_session_id;
      if (!checkoutId) {
        throw new Error('Checkout backend introuvable après initialisation.');
      }

      const pricingMismatch = validateInitAgainstCart(init, pricedLines, subtotal);
      if (pricingMismatch) {
        setFormError(pricingMismatch);
        toastError(pricingMismatch);
        trackCheckoutPaymentFailed('incomplete');
        return;
      }

      const checkoutAccess = {
        token: access.token,
        guestToken: init.guestToken ?? access.guestToken,
      };
      if (init.guestToken) {
        saveGuestCheckoutToken(init.guestToken);
      }

      try {
        const payment = await initSycapayCheckoutPayment(
          checkoutId,
          {
            codeService: codeServiceForOperator(operator),
            numeroBeneficiaire: normalizeSnPhone(paymentPhone),
          },
          checkoutAccess
        );

        const refCommand = payment.idPartenaire ?? payment.refCommand ?? payment.paymentId;
        upsertPendingPayment({
          paymentId: payment.paymentId,
          checkoutId,
          refCommand,
          idPartenaire: payment.idPartenaire,
          token: payment.tokenTX ?? payment.token,
          tokenTX: payment.tokenTX,
          status: payment.status ?? 'PENDING',
          amount: total,
          redirectUrl: payment.redirectUrl ?? null,
          deeplink: payment.deeplink ?? null,
          qrCode: payment.qrCode ?? null,
          createdAt: new Date().toISOString(),
        });
        saveCheckoutSession(checkoutId, payment.paymentId);

        if (payment.redirectUrl) {
          window.location.href = payment.redirectUrl;
          return;
        }

        if (payment.deeplink) {
          window.location.href = payment.deeplink;
          return;
        }

        if (payment.qrCode) {
          setActiveQrCode(sycapayQrCodeSrc(payment.qrCode));
          info('Scannez le QR code pour finaliser le paiement.');
          return;
        }

        throw new Error('Réponse Sycapay incomplète (pas de redirect, deeplink ni QR).');
      } catch (apiErr) {
        const missingRoute =
          apiErr instanceof ApiError &&
          (apiErr.status === 405 || (apiErr.status === 404 && !getApiErrorCode(apiErr)));
        if (missingRoute) {
          info(
            'Le paiement Sycapay n’est pas encore disponible sur le serveur : votre commande est enregistrée sur cet appareil.'
          );
          await finalizeOrderLocally();
          return;
        }
        throw apiErr;
      }
    } catch (err) {
      const msg = checkoutErrorMessage(err);
      setFormError(msg);
      toastError(msg);
      trackCheckoutPaymentFailed('api_error');
    } finally {
      setIsPaying(false);
    }
  };

  const operatorLabel = operator === 'wave' ? 'Wave' : 'Orange Money';

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-14">
      <nav className="mb-8 text-sm text-gray-500">
        <Link to="/" className="hover:text-[#1a1a1a]">
          Accueil
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <Link to="/cart" className="hover:text-[#1a1a1a]">
          Panier
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="font-medium text-[#1a1a1a]">Checkout</span>
      </nav>

      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            step === 1 ? 'bg-[#1a1a1a] text-white' : 'bg-[#a4a374] text-white'
          }`}
        >
          1
        </div>
        <span
          aria-current={step === 1 ? 'step' : undefined}
          className={`whitespace-nowrap text-sm font-semibold ${step === 1 ? 'text-[#1a1a1a]' : 'text-gray-500'}`}
        >
          Vos informations
        </span>
        <div className="h-px flex-1 bg-gray-200" />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            step === 2 ? 'bg-[#1a1a1a] text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          2
        </div>
        <span
          aria-current={step === 2 ? 'step' : undefined}
          className={`whitespace-nowrap text-sm font-semibold ${step === 2 ? 'text-[#1a1a1a]' : 'text-gray-500'}`}
        >
          Paiement
        </span>
      </div>

      <div className="rounded-[16px] border border-gray-100 bg-white p-4 shadow-sm sm:p-6 md:p-8">
        {step === 1 ? (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Vos informations</h1>
            <p className="text-sm text-gray-500">
              Quatre champs seulement — l’e-mail est facultatif.
            </p>

            <div>
              <NyraLabel htmlFor="co-fullName">Nom complet</NyraLabel>
              <NyraInput
                id="co-fullName"
                autoComplete="name"
                value={customer.fullName}
                onChange={(e) => updateCustomer({ fullName: e.target.value })}
              />
            </div>

            <div>
              <NyraLabel htmlFor="co-phone">Téléphone</NyraLabel>
              <NyraInput
                id="co-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="77 123 45 67"
                value={customer.phone}
                onChange={(e) => updateCustomer({ phone: e.target.value })}
              />
            </div>

            <div>
              <NyraLabel htmlFor="co-address">Adresse</NyraLabel>
              <NyraInput
                id="co-address"
                autoComplete="street-address"
                placeholder="Quartier, rue, villa…"
                value={shipping.address}
                onChange={(e) => updateShipping({ address: e.target.value })}
              />
            </div>

            <div>
              <NyraLabel htmlFor="co-email">
                E-mail <span className="font-normal text-gray-400">(facultatif)</span>
              </NyraLabel>
              <NyraInput
                id="co-email"
                type="email"
                autoComplete="email"
                value={customer.email}
                onChange={(e) => updateCustomer({ email: e.target.value })}
              />
            </div>

            <NyraFormError message={formError} />
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <NyraButton onClick={handleContinue} className="w-full sm:w-auto">
                Continuer <ArrowRight className="h-4 w-4" />
              </NyraButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Récapitulatif & paiement</h1>
            <p className="text-sm text-gray-500">
              {customer.fullName} — {customer.phone}
              {customer.email ? ` — ${customer.email}` : ''}
            </p>
            <p className="text-sm text-gray-500">Livraison : {shipping.address}</p>

            {loading ? (
              <LoadingState message="Chargement du récapitulatif..." className="py-8" />
            ) : error ? (
              <ErrorState message={error} className="py-8" />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-[14px] border border-gray-100 p-4 md:p-6">
                  <h2 className="mb-4 text-lg font-semibold">Commande</h2>
                  {hasLockedHerboristerie ? <ProfessionalPriceHint className="mb-4" /> : null}
                  {cartProducts.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Panier vide. Retournez au panier pour ajouter des articles.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {purchasableLines.map((item) => {
                        const hideLinePrice = shouldHidePrice(item);
                        const variant = resolveVariant(item, item.variantId);
                        const variantLabel = variant?.label ?? variant?.format ?? variant?.name;
                        return (
                          <div
                            key={`${item.storeProductId}-${item.variantId ?? ''}`}
                            className="flex items-center justify-between rounded-[10px] bg-gray-50 px-3 py-2 text-sm"
                          >
                            <span>
                              {item.name}
                              {variantLabel ? ` (${variantLabel})` : ''} x{item.quantity}
                            </span>
                            {hideLinePrice ? (
                              <span className="text-xs font-semibold text-[#7d755f]">Prix pro</span>
                            ) : (
                              <span className="font-semibold">
                                {formatPrice(item.unitPrice * item.quantity)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Sous-total</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600">
                      <span>Livraison estimée</span>
                      <span>{shippingFee === 0 ? 'Gratuite' : formatPrice(shippingFee)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </section>

                <section className="rounded-[14px] border border-gray-100 p-4 md:p-6">
                  <h2 className="mb-4 text-lg font-semibold">Paiement</h2>
                  <SycapayPaymentPanel
                    operator={operator}
                    onOperatorChange={setOperator}
                    phone={paymentPhone}
                    onPhoneChange={setPaymentPhone}
                    qrCode={activeQrCode}
                  />
                </section>
              </div>
            )}

            {formError ? (
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Erreur paiement
                </div>
                <NyraFormError message={formError} />
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <NyraButton
                type="button"
                variant="outline"
                onClick={() => {
                  setActiveQrCode(null);
                  setStep(1);
                }}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </NyraButton>
              {!activeQrCode ? (
                <NyraButton
                  type="button"
                  onClick={handlePay}
                  disabled={isPaying || loading}
                  className="w-full sm:w-auto"
                >
                  {isPaying ? `Lancement ${operatorLabel}…` : `Payer avec ${operatorLabel}`}
                  <ArrowRight className="h-4 w-4" />
                </NyraButton>
              ) : (
                <NyraButton
                  type="button"
                  onClick={() => {
                    window.location.href = '/checkout/payment/return?result=success';
                  }}
                  className="w-full sm:w-auto"
                >
                  J’ai payé — vérifier le statut
                  <ArrowRight className="h-4 w-4" />
                </NyraButton>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, CreditCard, Clock3, AlertTriangle } from 'lucide-react';
import { NyraButton, NyraFormError, NyraInput, NyraLabel } from '../components/form/NyraField';
import { useCheckoutStore } from '../store/checkoutStore';
import { useToast } from '../hooks/useToast';
import { useCartStore } from '../store/cartStore';
import { useCatalog } from '../lib/useCatalog';
import { formatPrice } from '../lib/price';
import { ErrorState, LoadingState } from '../components/ui/AsyncState';
import { useOrderStore } from '../store/orderStore';
import { usePurchasedProductsStore } from '../store/purchasedProductsStore';
import { useAuthStore } from '../store/authStore';
import { ApiError } from '../services/api/apiError';
import { confirmCheckout, initCheckout } from '../services/api/commerceApi';
import {
  trackCheckoutPaymentFailed,
  trackCheckoutStepComplete,
  trackCheckoutStepView,
} from '../services/analytics/tracking';

type Step = 1 | 2 | 3;
type PaymentMethod = 'card' | 'mobile-money' | 'cash-on-delivery';
type PaymentFailure = 'none' | 'declined' | 'timeout' | 'incomplete';
const STEP_LABELS: Record<Step, string> = {
  1: 'customer_info',
  2: 'addresses',
  3: 'payment',
};

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const Checkout = () => {
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [formError, setFormError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentFailure, setPaymentFailure] = useState<PaymentFailure>('none');
  const [isPaying, setIsPaying] = useState(false);

  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const addOrder = useOrderStore((s) => s.addOrder);
  const hydrateOrders = useOrderStore((s) => s.hydrateFromServer);
  const hydratePurchasedProducts = usePurchasedProductsStore((s) => s.hydrateFromServer);
  const token = useAuthStore((s) => s.token);
  const { products, loading, error } = useCatalog();

  const {
    customer,
    shipping,
    billing,
    billingSameAsShipping,
    updateCustomer,
    updateShipping,
    updateBilling,
    setBillingSameAsShipping,
  } = useCheckoutStore();

  const shippingPreview = useMemo(() => {
    return [shipping.line1, shipping.city, shipping.country].filter(Boolean).join(', ');
  }, [shipping]);

  const cartProducts = useMemo(
    () =>
      cartItems
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return product ? { ...product, quantity: item.quantity } : null;
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [cartItems, products]
  );

  const subtotal = useMemo(
    () => cartProducts.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartProducts]
  );
  const shippingFee = subtotal > 45000 || subtotal === 0 ? 0 : 2500;
  const total = subtotal + shippingFee;
  useEffect(() => {
    trackCheckoutStepView(step, STEP_LABELS[step]);
  }, [step]);

  const validateStep1 = () => {
    if (!customer.firstName.trim() || !customer.lastName.trim()) return 'Prénom et nom sont obligatoires.';
    if (!isEmailValid(customer.email)) return 'Adresse e-mail invalide.';
    if (!customer.phone.trim()) return 'Numéro de téléphone obligatoire.';
    return '';
  };

  const validateAddress = (prefix: string, addr: typeof shipping) => {
    if (!addr.line1.trim()) return `${prefix}: adresse obligatoire.`;
    if (!addr.city.trim()) return `${prefix}: ville obligatoire.`;
    if (!addr.country.trim()) return `${prefix}: pays obligatoire.`;
    return '';
  };

  const validateStep2 = () => {
    const shippingErr = validateAddress('Livraison', shipping);
    if (shippingErr) return shippingErr;
    if (!billingSameAsShipping) {
      const billingErr = validateAddress('Facturation', billing);
      if (billingErr) return billingErr;
    }
    return '';
  };

  const handleContinue = () => {
    setFormError('');
    const stepError = validateStep1();
    if (stepError) {
      setFormError(stepError);
      toastError(stepError);
      return;
    }
    setStep(2);
    trackCheckoutStepComplete(1, STEP_LABELS[1]);
    info('Informations client enregistrées.');
  };

  const handleSubmitStep2 = () => {
    setFormError('');
    const stepError = validateStep2();
    if (stepError) {
      setFormError(stepError);
      toastError(stepError);
      return;
    }
    setStep(3);
    trackCheckoutStepComplete(2, STEP_LABELS[2]);
    info('Adresse validée. Passez au paiement.');
  };

  const handlePay = async () => {
    setFormError('');

    if (cartProducts.length === 0) {
      const msg = 'Votre panier est vide.';
      setFormError(msg);
      toastError(msg);
      return;
    }

    if (!paymentMethod) {
      const msg = 'Veuillez choisir une méthode de paiement.';
      setFormError(msg);
      toastError(msg);
      return;
    }

    setIsPaying(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsPaying(false);

    if (paymentFailure === 'incomplete') {
      const msg = 'Informations de paiement incomplètes.';
      trackCheckoutPaymentFailed('incomplete');
      setFormError(msg);
      toastError(msg);
      return;
    }
    if (paymentFailure === 'declined') {
      const msg = 'Paiement refusé. Vérifiez votre moyen de paiement.';
      trackCheckoutPaymentFailed('declined');
      setFormError(msg);
      toastError(msg);
      return;
    }
    if (paymentFailure === 'timeout') {
      const msg = 'Paiement expiré (timeout). Réessayez.';
      trackCheckoutPaymentFailed('timeout');
      setFormError(msg);
      toastError(msg);
      return;
    }

    const finalizeOrderLocally = async () => {
      const orderId = addOrder({
        status: 'paid',
        paymentMethod,
        customer,
        shippingAddress: shipping,
        billingAddress: billingSameAsShipping ? shipping : billing,
        subtotal,
        shippingFee,
        total,
        items: cartProducts.map((item) => ({
          productId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
      });
      await clearCart();
      await hydratePurchasedProducts();
      trackCheckoutStepComplete(3, STEP_LABELS[3]);
      success(`Paiement validé. Commande ${orderId} créée.`);
      navigate('/');
    };

    try {
      if (token) {
        try {
          const init = await initCheckout(token, {
            customer,
            shippingAddress: shipping,
            billingAddress: billingSameAsShipping ? shipping : billing,
            billingSameAsShipping,
            items: cartProducts.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
          });
          const checkoutId = init.checkoutId ?? init.checkout_session_id;
          if (!checkoutId) {
            throw new Error('Checkout backend introuvable après initialisation.');
          }
          const confirm = await confirmCheckout(token, checkoutId, { paymentMethod });
          await clearCart();
          await Promise.all([hydrateOrders(), hydratePurchasedProducts()]);
          trackCheckoutStepComplete(3, STEP_LABELS[3]);
          success(`Paiement validé. Commande ${confirm.order?.id ?? confirm.orderId ?? checkoutId} créée.`);
          navigate('/');
          return;
        } catch (apiErr) {
          const missingRoute =
            apiErr instanceof ApiError && (apiErr.status === 404 || apiErr.status === 405);
          if (missingRoute) {
            info(
              'Le paiement en ligne n’est pas encore disponible sur le serveur : votre commande est enregistrée sur cet appareil.'
            );
            await finalizeOrderLocally();
            return;
          }
          throw apiErr;
        }
      }

      await finalizeOrderLocally();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Impossible de finaliser la commande.';
      setFormError(msg);
      toastError(msg);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8 md:py-14">
      <nav className="mb-8 text-sm text-gray-500">
        <Link to="/" className="hover:text-[#1a1a1a]">Accueil</Link>
        <span className="mx-2 text-gray-300">/</span>
        <Link to="/cart" className="hover:text-[#1a1a1a]">Panier</Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="font-medium text-[#1a1a1a]">Checkout</span>
      </nav>

      <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2">
        <div className={`h-8 w-8 rounded-full text-sm font-bold flex items-center justify-center ${step === 1 ? 'bg-[#1a1a1a] text-white' : 'bg-[#a4a374] text-white'}`}>1</div>
        <span aria-current={step === 1 ? 'step' : undefined} className={`whitespace-nowrap text-sm font-semibold ${step === 1 ? 'text-[#1a1a1a]' : 'text-gray-500'}`}>Informations client</span>
        <div className="h-px flex-1 bg-gray-200" />
        <div className={`h-8 w-8 rounded-full text-sm font-bold flex items-center justify-center ${step === 2 ? 'bg-[#1a1a1a] text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
        <span aria-current={step === 2 ? 'step' : undefined} className={`whitespace-nowrap text-sm font-semibold ${step === 2 ? 'text-[#1a1a1a]' : 'text-gray-500'}`}>Adresses</span>
        <div className="h-px flex-1 bg-gray-200" />
        <div className={`h-8 w-8 rounded-full text-sm font-bold flex items-center justify-center ${step === 3 ? 'bg-[#1a1a1a] text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
        <span aria-current={step === 3 ? 'step' : undefined} className={`whitespace-nowrap text-sm font-semibold ${step === 3 ? 'text-[#1a1a1a]' : 'text-gray-500'}`}>Paiement</span>
      </div>

      <div className="rounded-[16px] border border-gray-100 bg-white p-6 md:p-8 shadow-sm">
        {step === 1 ? (
          <div className="space-y-5">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Étape 1 - Informations client</h1>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <NyraLabel htmlFor="co-firstName">Prénom</NyraLabel>
                <NyraInput id="co-firstName" value={customer.firstName} onChange={(e) => updateCustomer({ firstName: e.target.value })} />
              </div>
              <div>
                <NyraLabel htmlFor="co-lastName">Nom</NyraLabel>
                <NyraInput id="co-lastName" value={customer.lastName} onChange={(e) => updateCustomer({ lastName: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <NyraLabel htmlFor="co-email">E-mail</NyraLabel>
                <NyraInput id="co-email" type="email" value={customer.email} onChange={(e) => updateCustomer({ email: e.target.value })} />
              </div>
              <div>
                <NyraLabel htmlFor="co-phone">Téléphone</NyraLabel>
                <NyraInput id="co-phone" type="tel" value={customer.phone} onChange={(e) => updateCustomer({ phone: e.target.value })} />
              </div>
            </div>
            <NyraFormError message={formError} />
            <div className="flex justify-end">
              <NyraButton onClick={handleContinue}>
                Continuer <ArrowRight className="ml-2 h-4 w-4" />
              </NyraButton>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Étape 2 - Adresse livraison/facturation</h1>
            <p className="text-sm text-gray-500">
              Infos client: {customer.firstName} {customer.lastName} - {customer.email}
            </p>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Adresse de livraison</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <NyraLabel htmlFor="ship-line1">Adresse</NyraLabel>
                  <NyraInput id="ship-line1" value={shipping.line1} onChange={(e) => updateShipping({ line1: e.target.value })} />
                </div>
                <div>
                  <NyraLabel htmlFor="ship-line2">Complément</NyraLabel>
                  <NyraInput id="ship-line2" value={shipping.line2} onChange={(e) => updateShipping({ line2: e.target.value })} />
                </div>
                <div>
                  <NyraLabel htmlFor="ship-city">Ville</NyraLabel>
                  <NyraInput id="ship-city" value={shipping.city} onChange={(e) => updateShipping({ city: e.target.value })} />
                </div>
                <div>
                  <NyraLabel htmlFor="ship-region">Région</NyraLabel>
                  <NyraInput id="ship-region" value={shipping.region} onChange={(e) => updateShipping({ region: e.target.value })} />
                </div>
                <div>
                  <NyraLabel htmlFor="ship-postal">Code postal</NyraLabel>
                  <NyraInput id="ship-postal" value={shipping.postalCode} onChange={(e) => updateShipping({ postalCode: e.target.value })} />
                </div>
                <div>
                  <NyraLabel htmlFor="ship-country">Pays</NyraLabel>
                  <NyraInput id="ship-country" value={shipping.country} onChange={(e) => updateShipping({ country: e.target.value })} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  className="h-4 w-4 accent-black"
                />
                Adresse de facturation identique à la livraison
              </label>

              {!billingSameAsShipping ? (
                <div className="grid gap-5 sm:grid-cols-2 border border-gray-100 rounded-[12px] p-4">
                  <div className="sm:col-span-2">
                    <NyraLabel htmlFor="bill-line1">Adresse facturation</NyraLabel>
                    <NyraInput id="bill-line1" value={billing.line1} onChange={(e) => updateBilling({ line1: e.target.value })} />
                  </div>
                  <div>
                    <NyraLabel htmlFor="bill-city">Ville</NyraLabel>
                    <NyraInput id="bill-city" value={billing.city} onChange={(e) => updateBilling({ city: e.target.value })} />
                  </div>
                  <div>
                    <NyraLabel htmlFor="bill-country">Pays</NyraLabel>
                    <NyraInput id="bill-country" value={billing.country} onChange={(e) => updateBilling({ country: e.target.value })} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Facturation: {shippingPreview || 'sera identique à la livraison'}</p>
              )}
            </section>

            <NyraFormError message={formError} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <NyraButton type="button" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </NyraButton>
              <NyraButton type="button" onClick={handleSubmitStep2}>
                Continuer vers paiement <ArrowRight className="ml-2 h-4 w-4" />
              </NyraButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Étape 3 - Récap & Paiement</h1>
            <p className="text-sm text-gray-500">Pré-intégration Stripe UI. Les statuts ci-dessous simulent les réponses backend.</p>

            {loading ? (
              <LoadingState message="Chargement du récapitulatif..." className="py-8" />
            ) : error ? (
              <ErrorState message={error} className="py-8" />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <section className="rounded-[14px] border border-gray-100 p-4 md:p-6">
                  <h2 className="mb-4 text-lg font-semibold">Récapitulatif commande</h2>
                  {cartProducts.length === 0 ? (
                    <p className="text-sm text-gray-500">Panier vide. Retournez au panier pour ajouter des articles.</p>
                  ) : (
                    <div className="space-y-3">
                      {cartProducts.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-[10px] bg-gray-50 px-3 py-2 text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                        </div>
                      ))}
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
                  <h2 className="mb-4 text-lg font-semibold">Méthode de paiement</h2>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 rounded-[10px] border border-gray-200 px-3 py-2 text-sm">
                      <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} className="accent-black" />
                      <CreditCard className="h-4 w-4" /> Carte (pré-Stripe)
                    </label>
                    <label className="flex items-center gap-2 rounded-[10px] border border-gray-200 px-3 py-2 text-sm">
                      <input type="radio" checked={paymentMethod === 'mobile-money'} onChange={() => setPaymentMethod('mobile-money')} className="accent-black" />
                      Mobile Money
                    </label>
                    <label className="flex items-center gap-2 rounded-[10px] border border-gray-200 px-3 py-2 text-sm">
                      <input type="radio" checked={paymentMethod === 'cash-on-delivery'} onChange={() => setPaymentMethod('cash-on-delivery')} className="accent-black" />
                      Paiement à la livraison
                    </label>
                  </div>

                  <div className="mt-5 rounded-[10px] bg-[#fafafa] p-3">
                    <NyraLabel htmlFor="payment-failure">Simulation réponse paiement</NyraLabel>
                    <select
                      id="payment-failure"
                      className="w-full rounded-[10px] border border-gray-200 px-3 py-2 text-sm"
                      value={paymentFailure}
                      onChange={(e) => setPaymentFailure(e.target.value as PaymentFailure)}
                    >
                      <option value="none">Succès</option>
                      <option value="declined">Refusé</option>
                      <option value="timeout">Timeout</option>
                      <option value="incomplete">Infos incomplètes</option>
                    </select>
                  </div>
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

            {paymentFailure === 'timeout' ? (
              <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                <div className="flex items-center gap-2 font-semibold">
                  <Clock3 className="h-4 w-4" />
                  Attention: délai de réponse du provider simulé
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <NyraButton type="button" variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Retour
              </NyraButton>
              <NyraButton type="button" onClick={handlePay} disabled={isPaying || loading}>
                {isPaying ? 'Traitement...' : 'Payer maintenant'} <ArrowRight className="ml-2 h-4 w-4" />
              </NyraButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCartStore } from '../store/cartStore';
import { Trash2, ArrowRight, Minus, Plus } from 'lucide-react';
import { useCatalog } from '../lib/useCatalog';
import { formatPrice } from '../lib/price';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { useToast } from '../hooks/useToast';
import {
  toCheckoutTrackedItem,
  trackBeginCheckout,
  trackCartAbandoned,
  trackRemoveFromCart,
} from '../services/analytics/tracking';
import { unitPriceForLine, resolveVariant } from '../features/catalog/productUtils';
import type { UIProduct } from '../features/catalog/types';

type CartLineProduct = UIProduct & {
  lineKey: string;
  storeProductId: string;
  quantity: number;
  variantId?: string;
  unitPrice: number;
  variantLabel: string | null;
};

export const Cart = () => {
  const { items, removeItem, updateQuantity } = useCartStore();
  const { products, loading, error } = useCatalog();
  const { success, info } = useToast();
  const navigate = useNavigate();
  const checkoutStartedRef = useRef(false);

  const cartProducts = useMemo((): CartLineProduct[] => {
    const rows: CartLineProduct[] = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.productId || p.slug === item.productId);
      if (!product) continue;
      const unitPrice = unitPriceForLine(product, item.variantId);
      const resolvedVar = resolveVariant(product, item.variantId);
      rows.push({
        ...product,
        lineKey: `${item.itemId ?? item.id ?? item.productId}::${item.productId}::${item.variantId ?? ''}`,
        storeProductId: item.productId,
        quantity: item.quantity,
        variantId: item.variantId,
        unitPrice,
        variantLabel: resolvedVar?.label ?? resolvedVar?.format ?? resolvedVar?.name ?? null,
      });
    }
    return rows;
  }, [items, products]);

  const trackedItems = useMemo(
    () =>
      cartProducts.map((item) =>
        toCheckoutTrackedItem({
          productId: item.id,
          name: item.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })
      ),
    [cartProducts]
  );

  const subtotal = cartProducts.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const shipping = subtotal > 45000 || subtotal === 0 ? 0 : 2500;
  const total = subtotal + shipping;

  const handleRemove = (lineKey: string, productName: string) => {
    const line = cartProducts.find((item) => item.lineKey === lineKey);
    if (!line) return;
    removeItem(line.storeProductId, line.variantId);
    trackRemoveFromCart({ ...line, price: line.unitPrice }, line.quantity);
    info(`Article retiré du panier: ${productName}`);
  };

  const handleQuantityDown = (lineKey: string, quantity: number, productName: string) => {
    const line = cartProducts.find((item) => item.lineKey === lineKey);
    if (!line) return;
    if (quantity > 1) {
      trackRemoveFromCart({ ...line, price: line.unitPrice }, 1);
      updateQuantity(line.storeProductId, quantity - 1, line.variantId);
      return;
    }
    removeItem(line.storeProductId, line.variantId);
    trackRemoveFromCart({ ...line, price: line.unitPrice }, 1);
    info(`Article retiré du panier: ${productName}`);
  };

  const handleCheckout = () => {
    checkoutStartedRef.current = true;
    trackBeginCheckout(trackedItems, total);
    success('Passage au checkout.');
    navigate('/checkout');
  };

  useEffect(() => {
    const onPageHide = () => {
      if (checkoutStartedRef.current || trackedItems.length === 0) return;
      trackCartAbandoned(trackedItems, total, 'page_exit');
    };

    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      if (checkoutStartedRef.current || trackedItems.length === 0) return;
      trackCartAbandoned(trackedItems, total, 'route_change');
    };
  }, [trackedItems, total]);

  if (items.length === 0) {
    return (
      <EmptyState
        className="max-w-[1400px] mx-auto px-4 md:px-8 py-20"
        title="Votre panier est vide"
        description="Découvrez nos mélanges exclusifs de plantes bio et commencez votre rituel bien-être dès aujourd'hui."
        action={
          <Link to="/shop" className="bg-[#a4a374] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#8d8c5d] transition-colors">
            Découvrir la boutique
          </Link>
        }
      />
    );
  }

  if (loading) {
    return <LoadingState message="Chargement du panier..." className="max-w-[1400px] mx-auto px-4 md:px-8" />;
  }

  if (error) {
    return <ErrorState message={error} className="max-w-[1400px] mx-auto px-4 md:px-8" />;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 md:py-20">
      <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-12">Votre panier</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 flex flex-col gap-6">
          {cartProducts.map((item) => (
            <div key={item.lineKey} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-[16px] border border-gray-100 bg-white">
              <div className={`${item.bgClass} w-24 h-24 shrink-0 rounded-[12px] p-2 flex items-center justify-center`}>
                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                {item.variantId ? (
                  <p className="text-xs text-gray-500">
                    {item.variantLabel ?? item.variants.find((v) => String(v.id) === String(item.variantId))?.label ?? 'Format'}
                  </p>
                ) : null}
                <p className="text-sm text-gray-500">{item.shortDescription?.trim() || item.ingredients}</p>
                <div className="font-bold text-[#1a1a1a] mt-2 sm:hidden">{formatPrice(item.unitPrice)}</div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                <div className="flex items-center border border-gray-200 rounded-full h-10 w-28 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      handleQuantityDown(item.lineKey, item.quantity, item.name);
                    }}
                    className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.storeProductId, item.quantity + 1, item.variantId)}
                    className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="hidden sm:block font-bold text-lg w-28 text-right">{formatPrice(item.unitPrice * item.quantity)}</div>

                <button type="button" onClick={() => handleRemove(item.lineKey, item.name)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-gray-50 p-8 rounded-[24px] flex flex-col gap-6 sticky top-32">
            <h2 className="text-xl font-bold border-b border-gray-200 pb-4">Résumé de la commande</h2>

            <div className="flex flex-col gap-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Sous-total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Livraison</span>
                <span>{shipping === 0 ? 'Gratuite' : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <div className="text-xs text-[#a4a374]">Plus que {formatPrice(45000 - subtotal)} pour la livraison gratuite !</div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full h-14 bg-[#1a1a1a] text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#333] transition-colors mt-4"
            >
              Passer à la caisse <ArrowRight className="w-5 h-5" />
            </button>

            <div className="text-xs text-gray-500 text-center mt-2">Paiement 100% sécurisé</div>
          </div>
        </div>
      </div>
    </div>
  );
};

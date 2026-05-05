import { Link } from 'react-router';
import { useCartStore } from '../store/cartStore';
import { Trash2, ArrowRight, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCatalog } from '../lib/useCatalog';
import { formatPrice } from '../lib/price';

export const Cart = () => {
  const { items, removeItem, updateQuantity } = useCartStore();
  const { products, loading, error } = useCatalog();

  const cartProducts = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const subtotal = cartProducts.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = subtotal > 45000 || subtotal === 0 ? 0 : 2500;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-4">Votre panier est vide</h1>
        <p className="text-gray-500 mb-8 max-w-md">Découvrez nos mélanges exclusifs de plantes bio et commencez votre rituel bien-être dès aujourd'hui.</p>
        <Link to="/shop" className="bg-[#a4a374] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#8d8c5d] transition-colors">
          Découvrir la boutique
        </Link>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 text-gray-500">Chargement du panier...</div>;
  }

  if (error) {
    return <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-16 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 md:py-20">
      <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-12">Votre panier</h1>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Items List */}
        <div className="flex-1 flex flex-col gap-6">
          {cartProducts.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-[16px] border border-gray-100 bg-white">
              <div className={`${item.bgClass} w-24 h-24 shrink-0 rounded-[12px] p-2 flex items-center justify-center`}>
                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
              </div>
              
              <div className="flex-1 flex flex-col gap-1">
                <h3 className="font-semibold text-lg">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.ingredients}</p>
                <div className="font-bold text-[#1a1a1a] mt-2 sm:hidden">{formatPrice(item.price)}</div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                <div className="flex items-center border border-gray-200 rounded-full h-10 w-28 bg-gray-50">
                  <button 
                    onClick={() => {
                      if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1);
                      else removeItem(item.id);
                    }}
                    className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-full flex items-center justify-center text-gray-500 hover:text-black"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="hidden sm:block font-bold text-lg w-28 text-right">
                  {formatPrice(item.price * item.quantity)}
                </div>

                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
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
                <div className="text-xs text-[#a4a374]">
                  Plus que {formatPrice(45000 - subtotal)} pour la livraison gratuite !
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>

            <button className="w-full h-14 bg-[#1a1a1a] text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#333] transition-colors mt-4">
              Passer à la caisse <ArrowRight className="w-5 h-5" />
            </button>

            <div className="text-xs text-gray-500 text-center mt-2">
              Paiement 100% sécurisé
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
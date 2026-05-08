import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { NyraButton, NyraFormError, NyraInput, NyraLabel } from '../components/form/NyraField';
import { useOrderStore } from '../store/orderStore';
import { useAddressStore, type UserAddress } from '../store/addressStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useViewedProductsStore } from '../store/viewedProductsStore';
import { useCatalog } from '../lib/useCatalog';
import { formatPrice } from '../lib/price';
import { useToast } from '../hooks/useToast';

export const Account = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<UserAddress, 'id'>>({
    label: 'Maison',
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'Sénégal',
    isDefault: false,
  });
  const [addressError, setAddressError] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const { success, error: toastError, info } = useToast();

  const orders = useOrderStore((s) => s.orders);
  const addresses = useAddressStore((s) => s.addresses);
  const addAddress = useAddressStore((s) => s.addAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);
  const removeAddress = useAddressStore((s) => s.removeAddress);
  const setDefaultAddress = useAddressStore((s) => s.setDefaultAddress);
  const wishlistIds = useWishlistStore((s) => s.ids);
  const viewedIds = useViewedProductsStore((s) => s.ids);
  const { products } = useCatalog();

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);
  }, [user]);

  if (!user) return null;

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id)).slice(0, 4);
  const viewedProducts = viewedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 4);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const totalSpent = useMemo(() => orders.reduce((acc, order) => acc + order.total, 0), [orders]);

  const validateAddressForm = () => {
    if (!addressForm.label.trim()) return 'Le libellé de l’adresse est obligatoire.';
    if (!addressForm.line1.trim()) return 'Adresse obligatoire.';
    if (!addressForm.city.trim()) return 'Ville obligatoire.';
    if (!addressForm.country.trim()) return 'Pays obligatoire.';
    return '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await updateProfile({
        firstName: firstName.trim() || user.firstName,
        lastName: lastName.trim() || user.lastName,
        phone: phone.trim(),
      });
      setSaved(true);
      success('Profil mis à jour.');
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Impossible d’enregistrer.');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');
    const validationError = validateAddressForm();
    if (validationError) {
      setAddressError(validationError);
      toastError(validationError);
      return;
    }
    if (editingAddressId) {
      await updateAddress(editingAddressId, addressForm);
      success('Adresse mise à jour.');
      setEditingAddressId(null);
    } else {
      await addAddress(addressForm);
      success('Adresse ajoutée.');
    }
    setAddressForm({
      label: 'Maison',
      line1: '',
      line2: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'Sénégal',
      isDefault: false,
    });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 text-sm text-gray-500 font-['Mulish',sans-serif]">
          <Link to="/" className="hover:text-[#1a1a1a]">
            Accueil
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-[#1a1a1a] font-medium">Mon compte</span>
        </nav>

        <div className="rounded-[16px] border border-gray-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 pb-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-['Mulish',sans-serif] text-2xl font-bold text-[#1a1a1a]">
                Bonjour, {user.firstName}
              </h1>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            </div>
            <NyraButton type="button" variant="outline" className="shrink-0" onClick={() => logout()}>
              Déconnexion
            </NyraButton>
          </div>

          <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-[12px] border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Commandes</p>
              <p className="mt-1 text-xl font-bold">{orders.length}</p>
            </div>
            <div className="rounded-[12px] border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Adresses</p>
              <p className="mt-1 text-xl font-bold">{addresses.length}</p>
            </div>
            <div className="rounded-[12px] border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Wishlist</p>
              <p className="mt-1 text-xl font-bold">{wishlistIds.length}</p>
            </div>
            <div className="rounded-[12px] border border-gray-100 p-4">
              <p className="text-xs text-gray-500">Total dépensé</p>
              <p className="mt-1 text-xl font-bold">{formatPrice(totalSpent)}</p>
            </div>
          </section>

          <form onSubmit={handleSave} className="mt-8 space-y-6">
            <h2 className="font-['Mulish',sans-serif] text-lg font-semibold text-[#303030]">
              Informations personnelles
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <NyraLabel htmlFor="acc-fn">Prénom</NyraLabel>
                <NyraInput
                  id="acc-fn"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <NyraLabel htmlFor="acc-ln">Nom</NyraLabel>
                <NyraInput
                  id="acc-ln"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div>
              <NyraLabel htmlFor="acc-phone">Téléphone</NyraLabel>
              <NyraInput
                id="acc-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+221 …"
                autoComplete="tel"
              />
            </div>
            <div>
              <NyraLabel htmlFor="acc-email">E-mail</NyraLabel>
              <NyraInput id="acc-email" type="email" value={user.email} disabled className="opacity-70 cursor-not-allowed" />
              <p className="mt-1 text-xs text-gray-400">La modification de l’e-mail sera disponible avec Strapi.</p>
            </div>
            <NyraFormError message={error} />
            {saved && (
              <p className="text-sm font-medium text-green-700 font-['Mulish',sans-serif]">
                Modifications enregistrées.
              </p>
            )}
            <NyraButton type="submit">Enregistrer</NyraButton>
          </form>

          <section className="mt-10 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-semibold">Historique commandes</h2>
            {orders.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">Aucune commande pour le moment.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="rounded-[12px] border border-gray-100 p-4">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between text-left"
                      onClick={() => setExpandedOrderId((prev) => (prev === order.id ? null : order.id))}
                    >
                      <div>
                        <p className="font-semibold">{order.id}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('fr-FR')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatPrice(order.total)}</p>
                        <p className="text-xs uppercase text-gray-500">{order.status}</p>
                      </div>
                    </button>
                    {expandedOrderId === order.id ? (
                      <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
                        <p className="mb-2 text-xs text-gray-500">Détail</p>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between">
                              <span>{item.name} x{item.quantity}</span>
                              <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-semibold">Gestion des adresses</h2>
            <form onSubmit={handleAddAddress} className="mt-4 grid gap-4 rounded-[12px] border border-gray-100 p-4 md:grid-cols-2">
              <div>
                <NyraLabel htmlFor="addr-label">Libellé</NyraLabel>
                <NyraInput id="addr-label" value={addressForm.label} onChange={(e) => setAddressForm((s) => ({ ...s, label: e.target.value }))} />
              </div>
              <div className="md:col-span-2">
                <NyraLabel htmlFor="addr-line1">Adresse</NyraLabel>
                <NyraInput id="addr-line1" value={addressForm.line1} onChange={(e) => setAddressForm((s) => ({ ...s, line1: e.target.value }))} />
              </div>
              <div>
                <NyraLabel htmlFor="addr-city">Ville</NyraLabel>
                <NyraInput id="addr-city" value={addressForm.city} onChange={(e) => setAddressForm((s) => ({ ...s, city: e.target.value }))} />
              </div>
              <div>
                <NyraLabel htmlFor="addr-country">Pays</NyraLabel>
                <NyraInput id="addr-country" value={addressForm.country} onChange={(e) => setAddressForm((s) => ({ ...s, country: e.target.value }))} />
              </div>
              <NyraFormError message={addressError} />
              <div className="md:col-span-2">
                <NyraButton type="submit">{editingAddressId ? 'Mettre à jour' : 'Ajouter adresse'}</NyraButton>
              </div>
            </form>

            <div className="mt-4 space-y-3">
              {addresses.map((address) => (
                <div key={address.id} className="rounded-[12px] border border-gray-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {address.label} {address.isDefault ? <span className="text-xs text-[#a4a374]">(par défaut)</span> : null}
                      </p>
                      <p className="text-sm text-gray-600">
                        {address.line1}, {address.city}, {address.country}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#a4a374] hover:underline"
                        onClick={() => {
                          setEditingAddressId(address.id);
                          setAddressForm({
                            label: address.label,
                            line1: address.line1,
                            line2: address.line2 ?? '',
                            city: address.city,
                            region: address.region ?? '',
                            postalCode: address.postalCode ?? '',
                            country: address.country,
                            isDefault: address.isDefault ?? false,
                          });
                          info('Adresse chargée pour édition.');
                        }}
                      >
                        Éditer
                      </button>
                      <button type="button" className="text-xs font-semibold text-gray-600 hover:underline" onClick={() => void setDefaultAddress(address.id)}>
                        Définir par défaut
                      </button>
                      <button type="button" className="text-xs font-semibold text-red-600 hover:underline" onClick={() => void removeAddress(address.id)}>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-semibold">Produits cliqués récemment</h2>
            {viewedProducts.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">Aucun produit consulté récemment.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {viewedProducts.map((product) => (
                  <Link key={product.id} to={`/product/${product.slug}`} className="rounded-[12px] border border-gray-100 p-3 hover:bg-gray-50">
                    <p className="line-clamp-1 text-sm font-semibold">{product.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatPrice(product.price)}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-semibold">Wishlist</h2>
            {wishlistProducts.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">Aucun produit dans la wishlist.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {wishlistProducts.map((product) => (
                  <Link key={product.id} to={`/product/${product.slug}`} className="rounded-[12px] border border-gray-100 p-3 hover:bg-gray-50">
                    <p className="line-clamp-1 text-sm font-semibold">{product.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatPrice(product.price)}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-100 pt-8">
            <Link to="/wishlist" className="text-sm font-semibold text-[#a4a374] hover:underline font-['Mulish',sans-serif]">
              Ma liste de souhaits →
            </Link>
            <Link to="/shop" className="text-sm font-semibold text-[#303030] hover:underline font-['Mulish',sans-serif]">
              Continuer mes achats →
            </Link>
            {defaultAddress ? <span className="text-sm text-gray-500">Adresse par défaut: {defaultAddress.line1}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

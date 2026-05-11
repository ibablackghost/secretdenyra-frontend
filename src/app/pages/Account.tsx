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
import { MediaImage } from '../components/ui/MediaImage';
import { usePurchasedProductsStore } from '../store/purchasedProductsStore';
import { Eye, Heart, LogOut, MapPinHouse, Package, Sparkles, UserRound, Wallet } from 'lucide-react';

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

  const orders = useOrderStore((s) => (Array.isArray(s.orders) ? s.orders : []));
  const addresses = useAddressStore((s) => (Array.isArray(s.addresses) ? s.addresses : []));
  const addAddress = useAddressStore((s) => s.addAddress);
  const updateAddress = useAddressStore((s) => s.updateAddress);
  const removeAddress = useAddressStore((s) => s.removeAddress);
  const setDefaultAddress = useAddressStore((s) => s.setDefaultAddress);
  const wishlistIds = useWishlistStore((s) => s.ids);
  const wishlistCount = useWishlistStore((s) => s.count);
  const viewedIds = useViewedProductsStore((s) => s.ids);
  const purchasedItems = usePurchasedProductsStore((s) => s.items);
  const { products } = useCatalog();

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);
  }, [user]);

  if (!user) return null;

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id) || wishlistIds.includes(p.slug)).slice(0, 4);
  const viewedProducts = viewedIds
    .map((id) => products.find((p) => p.id === id || p.slug === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 4);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const totalSpent = useMemo(
    () => orders.reduce((acc, order) => acc + (Number(order?.total) || 0), 0),
    [orders]
  );

  const getProductImage = (productId: string) => {
    const found = products.find((product) => product.id === productId || product.slug === productId);
    return found?.image ?? '';
  };

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

  const sectionClass = 'rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6';

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-7 text-sm text-gray-500 font-['Mulish',sans-serif]">
          <Link to="/" className="hover:text-[#1a1a1a]">
            Accueil
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-medium text-[#1a1a1a]">Mon compte</span>
        </nav>

        <section className="relative overflow-hidden rounded-[22px] border border-[#ece7db] bg-gradient-to-br from-[#f5f2ea] via-[#fbfaf7] to-white p-6 shadow-sm md:p-8">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#d9cda9]/25 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-0 h-36 w-36 rounded-full bg-[#a4a374]/20 blur-2xl" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a1a1a] text-white">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <p className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#6d6b60]">
                  <Sparkles className="h-3.5 w-3.5" /> Espace personnel
                </p>
                <h1 className="mt-2 font-['Mulish',sans-serif] text-2xl font-extrabold text-[#1a1a1a] md:text-3xl">
                  Bonjour, {user.firstName}
                </h1>
                <p className="mt-1 text-sm text-[#6e6a5f]">{user.email}</p>
              </div>
            </div>
            <NyraButton type="button" variant="outline" className="shrink-0 bg-white/80" onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" /> Déconnexion
            </NyraButton>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Package className="h-3.5 w-3.5" /> Commandes
            </p>
            <p className="mt-2 text-2xl font-extrabold text-[#1a1a1a]">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <MapPinHouse className="h-3.5 w-3.5" /> Adresses
            </p>
            <p className="mt-2 text-2xl font-extrabold text-[#1a1a1a]">{addresses.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Heart className="h-3.5 w-3.5" /> Wishlist
            </p>
            <p className="mt-2 text-2xl font-extrabold text-[#1a1a1a]">{wishlistCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Wallet className="h-3.5 w-3.5" /> Total dépensé
            </p>
            <p className="mt-2 text-2xl font-extrabold text-[#1a1a1a]">{formatPrice(totalSpent)}</p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className={sectionClass}>
            <h2 className="text-lg font-bold text-[#1a1a1a]">Informations personnelles</h2>
            <p className="mt-1 text-sm text-gray-500">Mettez à jour vos coordonnées pour simplifier vos prochaines commandes.</p>
            <form onSubmit={handleSave} className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <NyraLabel htmlFor="acc-fn">Prénom</NyraLabel>
                  <NyraInput id="acc-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
                </div>
                <div>
                  <NyraLabel htmlFor="acc-ln">Nom</NyraLabel>
                  <NyraInput id="acc-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
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
                <NyraInput id="acc-email" type="email" value={user.email} disabled className="cursor-not-allowed opacity-70" />
                <p className="mt-1 text-xs text-gray-400">La modification de l’e-mail sera disponible avec Strapi.</p>
              </div>
              <NyraFormError message={error} />
              {saved ? <p className="text-sm font-medium text-green-700">Modifications enregistrées.</p> : null}
              <NyraButton type="submit">Enregistrer</NyraButton>
            </form>
          </section>

          <section className={sectionClass}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#1a1a1a]">Gestion des adresses</h2>
                <p className="mt-1 text-sm text-gray-500">Ajoutez ou modifiez vos adresses de livraison et facturation.</p>
              </div>
              {defaultAddress ? (
                <span className="rounded-full bg-[#f5f2ea] px-3 py-1 text-xs font-semibold text-[#7d755f]">Par défaut: {defaultAddress.label}</span>
              ) : null}
            </div>

            <form onSubmit={handleAddAddress} className="mt-5 grid gap-4 rounded-2xl border border-gray-100 bg-[#fafafa] p-4 md:grid-cols-2">
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
              {addresses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                  Vous n’avez pas encore d’adresse enregistrée.
                </div>
              ) : null}
              {addresses.map((address) => (
                <div key={address.id} className="rounded-2xl border border-gray-100 p-4">
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
        </div>

        <section className={`${sectionClass} mt-6`}>
          <h2 className="text-lg font-bold text-[#1a1a1a]">Historique commandes</h2>
          {orders.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              Aucune commande pour le moment.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-gray-100 p-4">
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
                      <p className="text-xs uppercase tracking-wide text-gray-500">{order.status}</p>
                    </div>
                  </button>
                  {expandedOrderId === order.id ? (
                    <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Détail</p>
                      <div className="space-y-2">
                        {(Array.isArray(order.items) ? order.items : []).map((item) => (
                          <div key={`${order.id}-${item.productId}`} className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <MediaImage
                                src={getProductImage(item.productId)}
                                alt={item.name}
                                className="h-12 w-12 rounded-[10px] object-cover"
                                fallbackClassName="h-12 w-12"
                              />
                              <span className="line-clamp-1">{item.name} x{item.quantity}</span>
                            </div>
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

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className={sectionClass}>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
              <Eye className="h-5 w-5 text-[#a4a374]" /> Produits vus récemment
            </h2>
            {viewedProducts.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Aucun produit consulté récemment.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {viewedProducts.map((product) => (
                  <Link key={product.id} to={`/product/${product.slug}`} className="rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50">
                    <MediaImage
                      src={product.image}
                      alt={product.name}
                      className="h-24 w-full rounded-[10px] object-cover"
                      fallbackClassName="h-24 w-full"
                    />
                    <p className="mt-2 line-clamp-1 text-sm font-semibold">{product.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatPrice(product.price)}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className={sectionClass}>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
              <Heart className="h-5 w-5 text-[#a4a374]" /> Wishlist
            </h2>
            {wishlistProducts.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Aucun produit dans la wishlist.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {wishlistProducts.map((product) => (
                  <Link key={product.id} to={`/product/${product.slug}`} className="rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50">
                    <MediaImage
                      src={product.image}
                      alt={product.name}
                      className="h-24 w-full rounded-[10px] object-cover"
                      fallbackClassName="h-24 w-full"
                    />
                    <p className="mt-2 line-clamp-1 text-sm font-semibold">{product.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatPrice(product.price)}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className={sectionClass}>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
              <Package className="h-5 w-5 text-[#a4a374]" /> Produits achetés
            </h2>
            {purchasedItems.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">Aucun produit acheté pour le moment.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {purchasedItems.slice(0, 6).map((item) => {
                  const productId = item.productId ?? item.product?.id ?? item.productSlug ?? item.product?.slug ?? '';
                  const productName = item.productName ?? item.product?.name ?? 'Produit';
                  const totalQuantity = Number(item.totalQuantity ?? 0) || 0;
                  const totalSpentValue = Number(item.totalSpent ?? 0) || 0;
                  const currency = item.currency ?? item.product?.currency ?? 'XOF';
                  return (
                    <div key={`bought-${productId}-${productName}`} className="rounded-xl border border-gray-100 p-3">
                      <div className="flex items-center gap-3">
                        <MediaImage
                          src={item.product?.image ?? getProductImage(productId)}
                          alt={productName}
                          className="h-14 w-14 rounded-[10px] object-cover"
                          fallbackClassName="h-14 w-14"
                        />
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold">{productName}</p>
                          <p className="mt-1 text-xs text-gray-500">Quantité achetée: {totalQuantity}</p>
                          {totalSpentValue > 0 ? (
                            <p className="mt-1 text-xs text-gray-500">
                              Montant: {currency === 'XOF' ? formatPrice(totalSpentValue) : `${totalSpentValue} ${currency}`}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 pb-2">
          <Link to="/wishlist" className="text-sm font-semibold text-[#a4a374] hover:underline font-['Mulish',sans-serif]">
            Ma liste de souhaits →
          </Link>
          <Link to="/shop" className="text-sm font-semibold text-[#303030] hover:underline font-['Mulish',sans-serif]">
            Continuer mes achats →
          </Link>
        </div>
      </div>
    </div>
  );
};

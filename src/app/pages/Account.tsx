import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Building2,
  Eye,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPinHouse,
  Menu,
  Package,
  PackageCheck,
  Sparkles,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { NyraButton, NyraFormError, NyraInput, NyraLabel } from '../components/form/NyraField';
import { MediaImage } from '../components/ui/MediaImage';
import { ProAccountSection } from '../features/account/components/ProAccountSection';
import { PendingPaymentsBanner } from '../features/account/components/PendingPaymentsBanner';
import { PendingPaymentsSection } from '../features/account/components/PendingPaymentsSection';
import { useToast } from '../hooks/useToast';
import { usePendingPayments } from '../hooks/usePendingPayments';
import { formatPrice } from '../lib/price';
import { useCatalog } from '../lib/useCatalog';
import { useAddressStore, type UserAddress } from '../store/addressStore';
import { useAuthStore } from '../store/authStore';
import { useOrderStore } from '../store/orderStore';
import { usePurchasedProductsStore } from '../store/purchasedProductsStore';
import { useViewedProductsStore } from '../store/viewedProductsStore';
import { useWishlistStore } from '../store/wishlistStore';

type AccountSection =
  | 'overview'
  | 'profile'
  | 'addresses'
  | 'orders'
  | 'purchased'
  | 'wishlist'
  | 'viewed'
  | 'pro'
  | 'pending';

const SECTION_FROM_HASH: Record<string, AccountSection> = {
  '#paiements-en-attente': 'pending',
  '#profil': 'profile',
  '#adresses': 'addresses',
  '#commandes': 'orders',
  '#achetes': 'purchased',
  '#wishlist': 'wishlist',
  '#vus': 'viewed',
  '#pro': 'pro',
};

function sectionFromLocation(): AccountSection {
  if (typeof window === 'undefined') return 'overview';
  return SECTION_FROM_HASH[window.location.hash] ?? 'overview';
}

export const Account = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [section, setSection] = useState<AccountSection>(sectionFromLocation);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
  const { count: pendingPaymentsCount } = usePendingPayments();

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);
  }, [user]);

  useEffect(() => {
    const syncFromHash = () => {
      const next = sectionFromLocation();
      setSection(next);
      if (next === 'pending' && pendingPaymentsCount === 0) {
        setSection('overview');
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [pendingPaymentsCount]);

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlistIds.includes(p.id) || wishlistIds.includes(p.slug)),
    [products, wishlistIds]
  );
  const viewedProducts = useMemo(
    () =>
      viewedIds
        .map((id) => products.find((p) => p.id === id || p.slug === id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [products, viewedIds]
  );
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const totalSpent = useMemo(
    () => orders.reduce((acc, order) => acc + (Number(order?.total) || 0), 0),
    [orders]
  );

  if (!user) return null;

  const getProductImage = (productId: string) => {
    const found = products.find((product) => product.id === productId || product.slug === productId);
    return found?.image ?? '';
  };

  const goTo = (next: AccountSection) => {
    setSection(next);
    setMobileNavOpen(false);
    const hashEntry = Object.entries(SECTION_FROM_HASH).find(([, value]) => value === next);
    if (hashEntry) {
      window.history.replaceState(null, '', `/account${hashEntry[0]}`);
    } else {
      window.history.replaceState(null, '', '/account');
    }
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

  const navItems: Array<{
    id: AccountSection;
    label: string;
    icon: typeof LayoutDashboard;
    badge?: number;
    hide?: boolean;
  }> = [
    { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { id: 'profile', label: 'Profil', icon: UserRound },
    { id: 'addresses', label: 'Adresses', icon: MapPinHouse, badge: addresses.length || undefined },
    { id: 'orders', label: 'Commandes', icon: Package, badge: orders.length || undefined },
    { id: 'purchased', label: 'Produits achetés', icon: PackageCheck, badge: purchasedItems.length || undefined },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlistCount || undefined },
    { id: 'viewed', label: 'Récemment vus', icon: Eye },
    { id: 'pro', label: 'Compte pro', icon: Building2 },
    {
      id: 'pending',
      label: 'Paiements',
      icon: Wallet,
      badge: pendingPaymentsCount || undefined,
      hide: pendingPaymentsCount <= 0,
    },
  ];

  const panelClass = 'rounded-2xl border border-[#ece7db]/80 bg-white p-5 shadow-sm md:p-6';

  const SidebarNav = ({ className = '' }: { className?: string }) => (
    <nav className={className}>
      <ul className="space-y-1">
        {navItems
          .filter((item) => !item.hide)
          .map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => goTo(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#1a1a1a] text-white'
                      : 'text-[#4a473f] hover:bg-[#f3efe6]'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-[#a4a374]'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-[#efe9db] text-[#6d6b60]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
      </ul>
    </nav>
  );

  const overviewCards = (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {[
        { label: 'Commandes', value: orders.length, icon: Package, action: () => goTo('orders') },
        { label: 'Adresses', value: addresses.length, icon: MapPinHouse, action: () => goTo('addresses') },
        { label: 'Wishlist', value: wishlistCount, icon: Heart, action: () => goTo('wishlist') },
        { label: 'Total dépensé', value: formatPrice(totalSpent), icon: Wallet, action: () => goTo('orders') },
      ].map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={card.action}
          className="rounded-2xl border border-[#ece7db]/80 bg-white p-4 text-left shadow-sm transition hover:border-[#d9cda9]"
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <card.icon className="h-3.5 w-3.5" /> {card.label}
          </p>
          <p className="mt-2 text-2xl font-extrabold text-[#1a1a1a]">{card.value}</p>
        </button>
      ))}
    </div>
  );

  const purchasedList = (limit?: number) => {
    const list = typeof limit === 'number' ? purchasedItems.slice(0, limit) : purchasedItems;
    if (list.length === 0) {
      return <p className="mt-3 text-sm text-gray-500">Aucun produit acheté pour le moment.</p>;
    }
    return (
      <div className="mt-4 space-y-3">
        {list.map((item) => {
          const productId = item.productId ?? item.product?.id ?? item.productSlug ?? item.product?.slug ?? '';
          const productName = item.productName ?? item.product?.name ?? 'Produit';
          const totalQuantity = Number(item.totalQuantity ?? 0) || 0;
          const totalSpentValue = Number(item.totalSpent ?? 0) || 0;
          const currency = item.currency ?? item.product?.currency ?? 'XOF';
          const imageSrc = item.product?.image ?? getProductImage(productId);
          return (
            <div key={`bought-${productId}-${productName}`} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-center gap-3">
                <MediaImage
                  src={imageSrc}
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
    );
  };

  const productGrid = (
    items: Array<{ id: string; slug: string; name: string; image?: string; price: number }>,
    empty: string
  ) => {
    if (items.length === 0) return <p className="mt-3 text-sm text-gray-500">{empty}</p>;
    return (
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.slug}`}
            className="rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50"
          >
            <MediaImage
              src={product.image}
              alt={product.name}
              className="h-28 w-full rounded-[10px] object-cover"
              fallbackClassName="h-28 w-full"
            />
            <p className="mt-2 line-clamp-1 text-sm font-semibold">{product.name}</p>
            <p className="mt-1 text-xs text-gray-500">{formatPrice(product.price)}</p>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-[70vh] bg-[#f7f5f0]">
      <div className="mx-auto max-w-[1400px] px-4 py-8 md:py-10">
        <nav className="mb-6 text-sm text-gray-500 font-['Mulish',sans-serif]">
          <Link to="/" className="hover:text-[#1a1a1a]">
            Accueil
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-medium text-[#1a1a1a]">Mon compte</span>
        </nav>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Sidebar desktop */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 overflow-hidden rounded-2xl border border-[#ece7db] bg-white shadow-sm">
              <div className="border-b border-[#ece7db] bg-gradient-to-br from-[#f5f2ea] to-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a1a1a] text-white">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1a1a1a]">{user.firstName}</p>
                    <p className="truncate text-xs text-[#6e6a5f]">{user.email}</p>
                  </div>
                </div>
                <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-[#6d6b60]">
                  {user.isProfessional ? (
                    <>
                      <Building2 className="h-3 w-3" /> Pro
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" /> Personnel
                    </>
                  )}
                </p>
              </div>
              <div className="p-3">
                <SidebarNav />
              </div>
              <div className="border-t border-[#ece7db] p-3">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Déconnexion
                </button>
              </div>
            </div>
          </aside>

          {/* Contenu */}
          <div className="min-w-0 flex-1">
            {/* Header mobile + toggle */}
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
              <div>
                <h1 className="font-['Mulish',sans-serif] text-xl font-extrabold text-[#1a1a1a]">
                  Bonjour, {user.firstName}
                </h1>
                <p className="text-sm text-[#6e6a5f]">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen((v) => !v)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#ece7db] bg-white text-[#1a1a1a]"
                aria-label="Menu compte"
              >
                {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {mobileNavOpen ? (
              <div className="mb-4 rounded-2xl border border-[#ece7db] bg-white p-3 shadow-sm lg:hidden">
                <SidebarNav />
                <button
                  type="button"
                  onClick={() => logout()}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Déconnexion
                </button>
              </div>
            ) : null}

            {pendingPaymentsCount > 0 && section !== 'pending' ? (
              <PendingPaymentsBanner count={pendingPaymentsCount} />
            ) : null}

            {section === 'overview' ? (
              <div className="space-y-6">
                <section className="relative overflow-hidden rounded-[22px] border border-[#ece7db] bg-gradient-to-br from-[#f5f2ea] via-[#fbfaf7] to-white p-6 shadow-sm md:p-8">
                  <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#d9cda9]/25 blur-2xl" />
                  <h1 className="relative font-['Mulish',sans-serif] text-2xl font-extrabold text-[#1a1a1a] md:text-3xl">
                    Tableau de bord
                  </h1>
                  <p className="relative mt-2 max-w-xl text-sm text-[#6e6a5f]">
                    Gérez votre profil, vos commandes et vos préférences depuis un seul espace.
                  </p>
                </section>
                {overviewCards}
                <div className="grid gap-6 lg:grid-cols-2">
                  <section className={panelClass}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-bold text-[#1a1a1a]">Dernières commandes</h2>
                      <button type="button" className="text-xs font-semibold text-[#a4a374] hover:underline" onClick={() => goTo('orders')}>
                        Tout voir
                      </button>
                    </div>
                    {orders.length === 0 ? (
                      <p className="mt-3 text-sm text-gray-500">Aucune commande pour le moment.</p>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {orders.slice(0, 3).map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => goTo('orders')}
                            className="flex w-full items-center justify-between rounded-xl border border-gray-100 px-3 py-3 text-left hover:bg-gray-50"
                          >
                            <div>
                              <p className="text-sm font-semibold">{order.id}</p>
                              <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <p className="text-sm font-bold">{formatPrice(order.total)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                  <section className={panelClass}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-bold text-[#1a1a1a]">Produits achetés</h2>
                      <button type="button" className="text-xs font-semibold text-[#a4a374] hover:underline" onClick={() => goTo('purchased')}>
                        Tout voir
                      </button>
                    </div>
                    {purchasedList(4)}
                  </section>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Link to="/wishlist" className="text-sm font-semibold text-[#a4a374] hover:underline font-['Mulish',sans-serif]">
                    Ma liste de souhaits →
                  </Link>
                  <Link to="/shop" className="text-sm font-semibold text-[#303030] hover:underline font-['Mulish',sans-serif]">
                    Continuer mes achats →
                  </Link>
                </div>
              </div>
            ) : null}

            {section === 'profile' ? (
              <section className={panelClass}>
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
            ) : null}

            {section === 'addresses' ? (
              <section className={panelClass}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#1a1a1a]">Gestion des adresses</h2>
                    <p className="mt-1 text-sm text-gray-500">Ajoutez ou modifiez vos adresses de livraison.</p>
                  </div>
                  {defaultAddress ? (
                    <span className="rounded-full bg-[#f5f2ea] px-3 py-1 text-xs font-semibold text-[#7d755f]">
                      Par défaut: {defaultAddress.label}
                    </span>
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
            ) : null}

            {section === 'orders' ? (
              <section className={panelClass}>
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
                            <p className="text-xs uppercase tracking-wide text-gray-500">
                              {order.status === 'pending' ? 'En cours' : order.status}
                            </p>
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
                                    <span className="line-clamp-1">
                                      {item.name} x{item.quantity}
                                    </span>
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
            ) : null}

            {section === 'purchased' ? (
              <section className={panelClass}>
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
                  <PackageCheck className="h-5 w-5 text-[#a4a374]" /> Produits achetés
                </h2>
                {purchasedList()}
              </section>
            ) : null}

            {section === 'wishlist' ? (
              <section className={panelClass}>
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
                  <Heart className="h-5 w-5 text-[#a4a374]" /> Wishlist
                </h2>
                {productGrid(wishlistProducts, 'Aucun produit dans la wishlist.')}
              </section>
            ) : null}

            {section === 'viewed' ? (
              <section className={panelClass}>
                <h2 className="flex items-center gap-2 text-lg font-bold text-[#1a1a1a]">
                  <Eye className="h-5 w-5 text-[#a4a374]" /> Produits vus récemment
                </h2>
                {productGrid(viewedProducts, 'Aucun produit consulté récemment.')}
              </section>
            ) : null}

            {section === 'pro' ? (
              <div>
                <ProAccountSection />
              </div>
            ) : null}

            {section === 'pending' && pendingPaymentsCount > 0 ? <PendingPaymentsSection /> : null}
          </div>
        </div>
      </div>
    </div>
  );
};

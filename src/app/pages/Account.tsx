import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { NyraButton, NyraFormError, NyraInput, NyraLabel } from '../components/form/NyraField';

export const Account = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);
  }, [user]);

  if (!user) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      updateProfile({
        firstName: firstName.trim() || user.firstName,
        lastName: lastName.trim() || user.lastName,
        phone: phone.trim(),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Impossible d’enregistrer.');
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-2xl">
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

          <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-100 pt-8">
            <Link
              to="/wishlist"
              className="text-sm font-semibold text-[#a4a374] hover:underline font-['Mulish',sans-serif]"
            >
              Ma liste de souhaits →
            </Link>
            <Link to="/shop" className="text-sm font-semibold text-[#303030] hover:underline font-['Mulish',sans-serif]">
              Continuer mes achats →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { NyraButton, NyraFormCard, NyraFormError, NyraInput, NyraLabel } from '../components/form/NyraField';

export const Register = () => {
  const register = useAuthStore((s) => s.register);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/account', { replace: true });
  }, [isAuthenticated, navigate]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({ email, password, firstName, lastName });
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer le compte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16 md:py-24">
      <NyraFormCard
        className="max-w-xl"
        title="Créer un compte"
        subtitle="Rejoignez Secret de Nyra pour suivre vos commandes et votre liste de souhaits."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <NyraLabel htmlFor="reg-fn">Prénom</NyraLabel>
              <NyraInput
                id="reg-fn"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Aïcha"
              />
            </div>
            <div>
              <NyraLabel htmlFor="reg-ln">Nom</NyraLabel>
              <NyraInput
                id="reg-ln"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Diagne"
              />
            </div>
          </div>
          <div>
            <NyraLabel htmlFor="reg-email">E-mail</NyraLabel>
            <NyraInput
              id="reg-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
            />
          </div>
          <div>
            <NyraLabel htmlFor="reg-pw">Mot de passe</NyraLabel>
            <NyraInput
              id="reg-pw"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              required
              minLength={6}
            />
          </div>
          <div>
            <NyraLabel htmlFor="reg-pw2">Confirmer le mot de passe</NyraLabel>
            <NyraInput
              id="reg-pw2"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <NyraFormError message={error} />
          <NyraButton type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : "S'inscrire"}
          </NyraButton>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 font-['Mulish',sans-serif]">
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-semibold text-[#a4a374] hover:underline">
            Se connecter
          </Link>
        </p>
      </NyraFormCard>
    </div>
  );
};

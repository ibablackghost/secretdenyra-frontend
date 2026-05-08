import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { NyraButton, NyraFormCard, NyraFormError, NyraInput, NyraLabel } from '../components/form/NyraField';

export const Login = () => {
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/account';

  useEffect(() => {
    if (isAuthenticated) navigate('/account', { replace: true });
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email ou mot de passe incorrect.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16 md:py-24">
      <NyraFormCard
        title="Connexion"
        subtitle="Accédez à votre compte Secret de Nyra."
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <NyraLabel htmlFor="login-email">E-mail</NyraLabel>
            <NyraInput
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
            />
          </div>
          <div>
            <NyraLabel htmlFor="login-password">Mot de passe</NyraLabel>
            <NyraInput
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <NyraFormError message={error} />
          <NyraButton type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </NyraButton>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 font-['Mulish',sans-serif]">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-[#a4a374] hover:underline">
            Créer un compte
          </Link>
        </p>
      </NyraFormCard>
    </div>
  );
};

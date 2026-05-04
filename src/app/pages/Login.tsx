import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuthStore } from '../store/authStore';
import { NyraButton, NyraFormCard, NyraFormError, NyraInput, NyraLabel } from '../components/form/NyraField';

export const Login = () => {
  const login = useAuthStore((s) => s.login);
  const sessionUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/account';

  useEffect(() => {
    if (sessionUser) navigate('/account', { replace: true });
  }, [sessionUser, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = login(email, password);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    navigate(from, { replace: true });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-16 md:py-24">
      <NyraFormCard
        title="Connexion"
        subtitle="Accédez à votre compte Secret de Nyra. Les données sont stockées localement (démo) jusqu’à branchement Strapi."
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
          <NyraButton type="submit" className="w-full">
            Se connecter
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

import { Link } from 'react-router';
import { useAuthStore } from '@/app/store/authStore';

type ProfessionalPriceHintProps = {
  compact?: boolean;
  className?: string;
};

export function ProfessionalPriceHint({ compact = false, className = '' }: ProfessionalPriceHintProps) {
  const user = useAuthStore((s) => s.user);

  if (compact) {
    return (
      <p className={`text-xs font-semibold leading-snug text-[#7d755f] ${className}`}>
        Prix réservé aux professionnels
      </p>
    );
  }

  return (
    <div
      className={`rounded-xl border border-[#ece7db] bg-[#f5f2ea] px-4 py-3 text-sm text-[#5c5748] ${className}`}
    >
      <p className="font-semibold text-[#1a1a1a]">Tarifs herboristerie réservés aux comptes professionnels</p>
      <p className="mt-1">
        {user ? (
          <>
            Demandez l’accès depuis{' '}
            <Link to="/account" className="font-semibold text-[#a4a374] hover:underline">
              votre compte
            </Link>
            .
          </>
        ) : (
          <>
            <Link to="/login" className="font-semibold text-[#a4a374] hover:underline">
              Connectez-vous
            </Link>{' '}
            ou{' '}
            <Link to="/register" className="font-semibold text-[#a4a374] hover:underline">
              créez un compte
            </Link>{' '}
            pour demander l’accès pro.
          </>
        )}
      </p>
    </div>
  );
}


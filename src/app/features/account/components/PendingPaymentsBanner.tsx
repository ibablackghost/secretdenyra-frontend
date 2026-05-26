import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router';

type Props = {
  count: number;
};

export function PendingPaymentsBanner({ count }: Props) {
  if (count <= 0) return null;

  return (
    <div
      role="alert"
      className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">
            {count === 1 ? '1 paiement en attente de validation' : `${count} paiements en attente de validation`}
          </p>
          <p className="mt-1 text-sm text-amber-900/90">
            Finalisez votre paiement sur PayTech ou consultez le statut ci-dessous.
          </p>
        </div>
      </div>
      <a
        href="#paiements-en-attente"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
      >
        Voir le détail
      </a>
    </div>
  );
}

/** Bandeau global (header) — lien vers le compte. */
export function PendingPaymentsHeaderHint({ count }: Props) {
  if (count <= 0) return null;

  return (
    <Link
      to="/account#paiements-en-attente"
      className="hidden items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900 transition-colors hover:bg-amber-200 md:inline-flex"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-600" aria-hidden />
      Paiement en attente{count > 1 ? ` (${count})` : ''}
    </Link>
  );
}

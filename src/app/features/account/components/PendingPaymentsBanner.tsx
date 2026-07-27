import { Link } from 'react-router';
import { AlertTriangle } from 'lucide-react';

type Props = { count: number };

/** Affiché seulement s’il reste des paiements Sycapay PENDING. */
export function PendingPaymentsBanner({ count }: Props) {
  if (count <= 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">
            {count} paiement{count > 1 ? 's' : ''} en attente
          </p>
          <p className="mt-0.5 text-amber-800/90">
            Finalisez ou vérifiez le statut de votre paiement Sycapay.
          </p>
        </div>
      </div>
      <Link
        to="/account#paiements-en-attente"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#1a1a1a] px-4 py-2 text-xs font-semibold text-white hover:bg-black"
      >
        Voir les paiements
      </Link>
    </div>
  );
}

export function PendingPaymentsHeaderHint({ count }: Props) {
  if (count <= 0) return null;
  return (
    <Link
      to="/account#paiements-en-attente"
      className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-200"
    >
      {count} paiement{count > 1 ? 's' : ''} en attente
    </Link>
  );
}

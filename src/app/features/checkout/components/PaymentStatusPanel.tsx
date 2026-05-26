import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, Loader2 } from 'lucide-react';
import {
  isPaymentTerminal,
  paymentStatusLabel,
  type PaytechPaymentStatus,
} from '../../../services/payment/paytechTypes';

type Props = {
  status: PaytechPaymentStatus | null;
  isPolling: boolean;
  errorMessage?: string | null;
  redirectUrl?: string | null;
};

export function PaymentStatusPanel({ status, isPolling, errorMessage, redirectUrl }: Props) {
  if (!status && !isPolling && !errorMessage) return null;

  const terminal = status ? isPaymentTerminal(status) : false;
  const success = status === 'SUCCESS';
  const failed = status === 'FAILLED' || status === 'CANCELED';

  const borderClass = success
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : failed
      ? 'border-red-200 bg-red-50 text-red-900'
      : 'border-amber-200 bg-amber-50 text-amber-900';

  return (
    <div className={`rounded-[12px] border p-4 text-sm ${borderClass}`}>
      <div className="flex items-start gap-3">
        {isPolling && !terminal ? (
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
        ) : success ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
        ) : failed ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        ) : (
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="font-semibold">
            {status ? paymentStatusLabel(status) : 'Vérification du paiement…'}
          </p>
          {isPolling && !terminal ? (
            <p className="text-xs opacity-90">Confirmation en cours avec PayTech.</p>
          ) : null}
          {errorMessage ? <p className="text-xs font-medium">{errorMessage}</p> : null}
          {redirectUrl && !success ? (
            <a
              href={redirectUrl}
              className="inline-flex items-center gap-1 font-semibold underline"
            >
              Reprendre le paiement PayTech <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

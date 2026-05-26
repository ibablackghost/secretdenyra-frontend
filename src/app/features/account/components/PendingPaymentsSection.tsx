import { useState } from 'react';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';
import { NyraButton } from '../../../components/form/NyraField';
import { usePendingPayments } from '../../../hooks/usePendingPayments';
import { paymentStatusLabel } from '../../../services/payment/paytechTypes';
import { formatPrice } from '../../../lib/price';
import { useToast } from '../../../hooks/useToast';

export function PendingPaymentsSection() {
  const { awaiting, refreshPayment, refreshAll } = usePendingPayments();
  const { success, error: toastError } = useToast();
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  if (awaiting.length === 0) return null;

  const handleRefresh = async (paymentId: string) => {
    setRefreshingId(paymentId);
    try {
      const result = await refreshPayment(paymentId);
      if (!result) return;
      if (result.status === 'SUCCESS') {
        success('Paiement confirmé. Votre commande a été mise à jour.');
      } else if (result.status === 'FAILLED' || result.status === 'CANCELED') {
        toastError(result.errorType?.message ?? 'Le paiement a échoué ou a été annulé.');
      }
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Impossible de vérifier le paiement.');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    try {
      await refreshAll();
      success('Statuts des paiements mis à jour.');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Impossible de rafraîchir les paiements.');
    } finally {
      setRefreshingAll(false);
    }
  };

  return (
    <section id="paiements-en-attente" className="mt-6 scroll-mt-24 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1a1a1a]">Paiements PayTech en attente</h2>
          <p className="mt-1 text-sm text-gray-500">
            Finalisez votre paiement sur PayTech ou actualisez le statut ici.
          </p>
        </div>
        <NyraButton
          type="button"
          variant="outline"
          className="!px-4 !py-2 text-xs"
          disabled={refreshingAll}
          onClick={() => void handleRefreshAll()}
        >
          {refreshingAll ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Tout actualiser
        </NyraButton>
      </div>

      <div className="mt-4 space-y-3">
        {awaiting.map((payment) => {
          const isRefreshing = refreshingId === payment.paymentId;
          return (
            <article key={payment.paymentId} className="rounded-2xl border border-amber-100 bg-[#fffdf8] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#1a1a1a]">PayTech</p>
                  <p className="mt-1 text-sm text-gray-600">{paymentStatusLabel(payment.status)}</p>
                  {payment.amount != null ? (
                    <p className="mt-1 text-sm font-semibold">{formatPrice(payment.amount)}</p>
                  ) : null}
                  {payment.createdAt ? (
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(payment.createdAt).toLocaleString('fr-FR')}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {payment.redirectUrl ? (
                    <a
                      href={payment.redirectUrl}
                      className="inline-flex items-center gap-1 rounded-full border border-[#1a1a1a] px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                    >
                      Payer sur PayTech <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full bg-[#a4a374] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    disabled={isRefreshing}
                    onClick={() => void handleRefresh(payment.paymentId)}
                  >
                    {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Vérifier
                  </button>
                </div>
              </div>
              {payment.checkoutId ? (
                <p className="mt-3 text-xs text-gray-500">
                  <Link to="/checkout" className="font-semibold text-[#a4a374] hover:underline">
                    Retour au checkout →
                  </Link>
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

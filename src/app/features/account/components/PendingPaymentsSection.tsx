import { ExternalLink, RefreshCw } from 'lucide-react';
import { NyraButton } from '../../../components/form/NyraField';
import { usePendingPayments } from '../../../hooks/usePendingPayments';
import { formatPrice } from '../../../lib/price';
import { paymentStatusLabel } from '../../../services/payment/sycapayTypes';
import { useToast } from '../../../hooks/useToast';

export function PendingPaymentsSection() {
  const { awaiting, refreshPayment, refreshAll } = usePendingPayments();
  const { success, error: toastError } = useToast();

  if (awaiting.length === 0) return null;

  const handleRefreshOne = async (paymentId: string) => {
    try {
      const result = await refreshPayment(paymentId);
      if (result?.status === 'SUCCESS') success('Paiement confirmé.');
      else if (result) success(`Statut : ${paymentStatusLabel(result.status)}`);
    } catch {
      toastError('Impossible de vérifier ce paiement.');
    }
  };

  const handleRefreshAll = async () => {
    try {
      await refreshAll();
      success('Statuts actualisés.');
    } catch {
      toastError('Impossible d’actualiser les paiements.');
    }
  };

  return (
    <section
      id="paiements-en-attente"
      className="scroll-mt-24 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#1a1a1a]">Paiements en attente</h2>
          <p className="mt-1 text-sm text-gray-500">
            Reprenez le paiement Sycapay ou vérifiez le statut après confirmation.
          </p>
        </div>
        <NyraButton type="button" variant="outline" onClick={() => void handleRefreshAll()}>
          <RefreshCw className="h-4 w-4" /> Actualiser
        </NyraButton>
      </div>

      <div className="mt-4 space-y-3">
        {awaiting.map((item) => (
          <div key={item.paymentId} className="rounded-xl border border-gray-100 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#1a1a1a]">Sycapay</p>
                <p className="text-xs text-gray-500">
                  {item.refCommand ?? item.idPartenaire ?? item.paymentId}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  {paymentStatusLabel(item.status)}
                </p>
                {typeof item.amount === 'number' ? (
                  <p className="mt-1 text-sm font-medium">{formatPrice(item.amount)}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <NyraButton type="button" variant="outline" onClick={() => void handleRefreshOne(item.paymentId)}>
                  Vérifier
                </NyraButton>
                {item.redirectUrl ? (
                  <a href={item.redirectUrl} className="inline-flex">
                    <NyraButton type="button">
                      Reprendre le paiement <ExternalLink className="h-3.5 w-3.5" />
                    </NyraButton>
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

import { ShieldCheck } from 'lucide-react';

export function PaytechPaymentInfo() {
  return (
    <div className="mt-4 rounded-[12px] border border-[#ece7db] bg-[#fafaf7] p-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#a4a374]" aria-hidden />
        <div className="text-sm text-gray-700">
          <p className="font-semibold text-[#1a1a1a]">Paiement sécurisé via PayTech</p>
          <p className="mt-2 text-gray-600">
            Aucun compte requis : renseignez vos coordonnées, puis vous serez redirigé vers PayTech (Wave,
            Orange Money, carte bancaire, etc.).
          </p>
        </div>
      </div>
    </div>
  );
}

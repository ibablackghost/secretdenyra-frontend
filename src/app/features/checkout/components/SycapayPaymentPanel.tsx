import waveLogo from '@/assets/wave.webp';
import orangeLogo from '@/assets/orange.png';
import {
  SYCAPAY_OPERATORS,
  type SycapayOperator,
} from '../../../services/payment/sycapayTypes';

const OPERATOR_LOGOS: Record<SycapayOperator, string> = {
  wave: waveLogo,
  orange_money: orangeLogo,
};

type Props = {
  operator: SycapayOperator;
  onOperatorChange: (operator: SycapayOperator) => void;
  /** Téléphone client (déjà saisi) — réutilisé comme numeroBeneficiaire. */
  phoneDisplay: string;
  qrCode?: string | null;
};

export function SycapayPaymentPanel({
  operator,
  onOperatorChange,
  phoneDisplay,
  qrCode,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-sm font-semibold text-[#1a1a1a]">Moyen de paiement</p>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Opérateur de paiement">
          {SYCAPAY_OPERATORS.map((op) => {
            const selected = operator === op.id;
            return (
              <button
                key={op.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onOperatorChange(op.id)}
                className={`flex flex-col items-center gap-2 rounded-[14px] border p-3 transition ${
                  selected
                    ? 'border-[#1a1a1a] bg-[#fafaf7] ring-1 ring-[#1a1a1a]'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <img
                  src={OPERATOR_LOGOS[op.id]}
                  alt=""
                  className="h-12 w-12 object-contain"
                  width={48}
                  height={48}
                />
                <span className="text-sm font-semibold text-[#1a1a1a]">{op.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[12px] border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
        Paiement sur le numéro{' '}
        <span className="font-semibold text-[#1a1a1a]">+221 {phoneDisplay || '—'}</span>
      </div>

      {qrCode ? (
        <div className="rounded-[12px] border border-[#ece7db] bg-[#fafaf7] p-4 text-center">
          <p className="mb-3 text-sm font-semibold text-[#1a1a1a]">Scannez pour payer</p>
          <img
            src={qrCode}
            alt="QR code de paiement Orange Money"
            className="mx-auto h-44 w-44 rounded-lg bg-white object-contain p-2"
          />
          <p className="mt-3 text-xs text-gray-500">
            Ouvrez Orange Money, scannez le code, puis revenez sur cette page.
          </p>
        </div>
      ) : null}

      <div className="rounded-[12px] border border-[#ece7db] bg-[#fafaf7] p-4 text-sm text-gray-600">
        Paiement sécurisé via Sycapay — Wave ou Orange Money uniquement.
      </div>
    </div>
  );
}

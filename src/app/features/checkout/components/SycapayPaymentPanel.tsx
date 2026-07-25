import waveLogo from '@/assets/wave.webp';
import orangeLogo from '@/assets/orange.png';
import {
  SYCAPAY_OPERATORS,
  type SycapayOperator,
} from '../../../services/payment/sycapayTypes';

const OPERATOR_VISUAL: Record<
  SycapayOperator,
  { logo: string; selectedRing: string; softBg: string; label: string; logoClass: string }
> = {
  wave: {
    logo: waveLogo,
    selectedRing: 'ring-[#1DC8FF]/60 border-[#1DC8FF]',
    softBg: 'bg-[#E8F9FF]',
    label: 'Wave',
    logoClass: 'h-16 w-16 rounded-2xl shadow-sm',
  },
  orange_money: {
    logo: orangeLogo,
    selectedRing: 'ring-[#FF7900]/60 border-[#FF7900]',
    softBg: 'bg-white',
    label: 'Orange Money',
    logoClass: 'h-16 w-16 rounded-2xl shadow-sm',
  },
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
            const visual = OPERATOR_VISUAL[op.id];
            return (
              <button
                key={op.id}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={visual.label}
                title={visual.label}
                onClick={() => onOperatorChange(op.id)}
                className={`group relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border-2 p-4 transition duration-200 ${
                  selected
                    ? `${visual.softBg} ${visual.selectedRing} ring-2 shadow-sm scale-[1.02]`
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/80'
                }`}
              >
                <img
                  src={visual.logo}
                  alt=""
                  className={`object-contain transition duration-200 ${visual.logoClass} ${
                    selected ? 'scale-105' : 'group-hover:scale-105'
                  }`}
                  width={72}
                  height={72}
                />
                {selected ? (
                  <span
                    className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                      op.id === 'orange_money'
                        ? 'bg-[#FF7900] text-white'
                        : 'bg-[#1a1a1a] text-white'
                    }`}
                    aria-hidden
                  >
                    ✓
                  </span>
                ) : null}
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
    </div>
  );
}

import type { InputHTMLAttributes } from 'react';

const fieldClass =
  'min-h-[48px] w-full rounded-[10px] border border-gray-200 bg-white px-4 py-3 font-["Mulish",sans-serif] text-base text-[#1a1a1a] placeholder:text-gray-400 outline-none transition-shadow focus:border-[#a4a374] focus:ring-2 focus:ring-[#a4a374]/25 touch-manipulation';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
};

/** Normalise un numéro SN : chiffres seuls, sans indicatif +221. */
export function normalizeSnPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('221') && digits.length > 9) {
    digits = digits.slice(3);
  }
  if (digits.startsWith('0') && digits.length === 10) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 9);
}

export function isSnPhoneValid(raw: string) {
  return /^7\d{8}$/.test(normalizeSnPhone(raw));
}

/** Champ téléphone Sénégal : préfixe UI fixe +221, valeur API = 9 chiffres nationaux. */
export function SnPhoneInput({ value, onChange, id, className = '', ...rest }: Props) {
  const national = normalizeSnPhone(value);

  return (
    <div className="flex overflow-hidden rounded-[10px] border border-gray-200 focus-within:border-[#a4a374] focus-within:ring-2 focus-within:ring-[#a4a374]/25">
      <span
        className="flex shrink-0 items-center border-r border-gray-200 bg-[#fafaf7] px-3 text-sm font-semibold text-[#1a1a1a]"
        aria-hidden
      >
        +221
      </span>
      <input
        {...rest}
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="77 123 45 67"
        value={national}
        onChange={(e) => onChange(normalizeSnPhone(e.target.value))}
        className={`${fieldClass} rounded-none border-0 focus:ring-0 ${className}`}
        aria-describedby={id ? `${id}-hint` : undefined}
      />
    </div>
  );
}

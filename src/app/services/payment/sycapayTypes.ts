/** Codes service Sycapay — v1 Nyra : Wave + Orange Money uniquement. */
export type SycapayCodeService = 'SN_PM_WAVE' | 'SN_PM_OM';

export type SycapayOperator = 'wave' | 'orange_money';

export const SYCAPAY_OPERATORS: Array<{
  id: SycapayOperator;
  codeService: SycapayCodeService;
  label: string;
}> = [
  { id: 'wave', codeService: 'SN_PM_WAVE', label: 'Wave' },
  { id: 'orange_money', codeService: 'SN_PM_OM', label: 'Orange Money' },
];

export function codeServiceForOperator(operator: SycapayOperator): SycapayCodeService {
  return SYCAPAY_OPERATORS.find((o) => o.id === operator)?.codeService ?? 'SN_PM_WAVE';
}

/** Statuts paiement côté Nyra (alignés webhook Sycapay SUCCESS / FAILED). */
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILLED' | 'CANCELED';

export type PaymentError = {
  code?: string;
  message?: string;
};

export type InitSycapayPaymentInput = {
  codeService: SycapayCodeService;
  numeroBeneficiaire: string;
};

export type InitSycapayPaymentResponse = {
  paymentId: string;
  idPartenaire?: string;
  tokenTX?: string;
  /** Alias legacy PayTech — certains backends renvoient encore refCommand */
  refCommand?: string;
  token?: string;
  status?: PaymentStatus;
  redirectUrl?: string | null;
  deeplink?: string | null;
  qrCode?: string | null;
  otpRequired?: boolean;
};

export type PaymentStatusResponse = {
  paymentId: string;
  status: PaymentStatus;
  refCommand?: string;
  idPartenaire?: string;
  token?: string;
  tokenTX?: string;
  paymentMethod?: string;
  errorType?: PaymentError | null;
};

export type PendingPaymentSummary = {
  paymentId: string;
  checkoutId?: string;
  orderId?: string;
  refCommand?: string;
  idPartenaire?: string;
  token?: string;
  tokenTX?: string;
  status: PaymentStatus;
  amount?: number;
  redirectUrl?: string | null;
  deeplink?: string | null;
  qrCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const PAYMENT_METHOD_SYCAPAY = 'sycapay' as const;

/** @deprecated Prefer PAYMENT_METHOD_SYCAPAY */
export const PAYMENT_METHOD_PAYTECH = 'paytech' as const;

export type PaytechPaymentStatus = PaymentStatus;
export type PaytechPaymentError = PaymentError;
export type InitPaytechPaymentResponse = {
  paymentId: string;
  refCommand: string;
  token?: string;
  status: PaymentStatus;
  redirectUrl: string;
};

export function isPaymentAwaitingAction(status: PaymentStatus): boolean {
  return status === 'PENDING';
}

export function isPaymentTerminal(status: PaymentStatus): boolean {
  return status === 'SUCCESS' || status === 'FAILLED' || status === 'CANCELED';
}

export function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case 'PENDING':
      return 'En attente de paiement';
    case 'SUCCESS':
      return 'Paiement confirmé';
    case 'FAILLED':
      return 'Paiement échoué';
    case 'CANCELED':
      return 'Paiement annulé';
    default:
      return status;
  }
}

/** Normalise un qrCode Sycapay (base64 brut ou data URI). */
export function sycapayQrCodeSrc(qrCode: string): string {
  const trimmed = qrCode.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `data:image/png;base64,${trimmed}`;
}

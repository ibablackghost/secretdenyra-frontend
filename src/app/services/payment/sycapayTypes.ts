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
  /** Lien unique (si le backend mappe déjà deepLinks.OM) */
  deeplink?: string | null;
  /** Réponse brute Sycapay OM : deepLinks.OM / deepLinks.MAXIT */
  deepLinks?: {
    OM?: string | null;
    MAXIT?: string | null;
    [key: string]: string | null | undefined;
  } | null;
  urlRedirection?: string | null;
  qrCode?: string | null;
  otpRequired?: boolean;
  /** Sycapay renvoie parfois errorCode "201" = paiement en cours (succès à rediriger). */
  errorCode?: string | number;
  errorMessage?: string;
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

/**
 * Choisit l’URL de paiement à ouvrir.
 * OM Sycapay : `deepLinks.OM` / `MAXIT` (lien https) prioritaire sur le QR.
 * Explore aussi les payloads imbriqués renvoyés par certains backends.
 */
export function resolveSycapayOpenUrl(
  payment: InitSycapayPaymentResponse & Record<string, unknown>
): string | null {
  const nested =
    payment.data && typeof payment.data === 'object'
      ? (payment.data as Record<string, unknown>)
      : null;
  const provider =
    payment.providerResponse && typeof payment.providerResponse === 'object'
      ? (payment.providerResponse as Record<string, unknown>)
      : payment.sycapay && typeof payment.sycapay === 'object'
        ? (payment.sycapay as Record<string, unknown>)
        : nested;

  const deepLinksRaw = payment.deepLinks ?? provider?.deepLinks;
  const deepLinks =
    deepLinksRaw && typeof deepLinksRaw === 'object'
      ? (deepLinksRaw as Record<string, unknown>)
      : null;

  const candidates = [
    payment.redirectUrl,
    payment.urlRedirection,
    payment.deeplink,
    deepLinks?.OM,
    deepLinks?.MAXIT,
    deepLinks?.om,
    deepLinks?.maxit,
    typeof payment.deepLink === 'string' ? payment.deepLink : null,
    typeof provider?.redirectUrl === 'string' ? provider.redirectUrl : null,
    typeof provider?.urlRedirection === 'string' ? provider.urlRedirection : null,
    typeof provider?.deeplink === 'string' ? provider.deeplink : null,
  ];

  for (const raw of candidates) {
    if (typeof raw === 'string' && raw.trim().startsWith('http')) {
      return raw.trim();
    }
  }
  return null;
}

/** Normalise un qrCode Sycapay (base64 brut ou data URI). */
export function sycapayQrCodeSrc(qrCode: string): string {
  const trimmed = qrCode.trim();
  if (trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `data:image/png;base64,${trimmed}`;
}

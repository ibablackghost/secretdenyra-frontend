/** Statuts paiement côté Nyra (alignés IPN PayTech : sale_complete / sale_canceled). */
export type PaytechPaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILLED' | 'CANCELED';

export type PaytechPaymentError = {
  code?: string;
  message?: string;
};

export type InitPaytechPaymentResponse = {
  paymentId: string;
  refCommand: string;
  token?: string;
  status: PaytechPaymentStatus;
  redirectUrl: string;
};

export type PaymentStatusResponse = {
  paymentId: string;
  status: PaytechPaymentStatus;
  refCommand?: string;
  token?: string;
  paymentMethod?: string;
  errorType?: PaytechPaymentError | null;
};

export type PendingPaymentSummary = {
  paymentId: string;
  checkoutId?: string;
  orderId?: string;
  refCommand?: string;
  token?: string;
  status: PaytechPaymentStatus;
  amount?: number;
  redirectUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const PAYMENT_METHOD_PAYTECH = 'paytech' as const;

export function isPaymentAwaitingAction(status: PaytechPaymentStatus): boolean {
  return status === 'PENDING';
}

export function isPaymentTerminal(status: PaytechPaymentStatus): boolean {
  return status === 'SUCCESS' || status === 'FAILLED' || status === 'CANCELED';
}

export function paymentStatusLabel(status: PaytechPaymentStatus): string {
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

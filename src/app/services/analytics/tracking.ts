type AnalyticsPayload = Record<string, unknown>;

type TrackedItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
};

type ProductLike = {
  id: string;
  name: string;
  price: number;
  category?: { name?: string };
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    posthog?: { capture?: (event: string, properties?: Record<string, unknown>) => void };
    dataLayer?: unknown[];
  }
}

const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS !== 'false';
const DEDUP_PREFIX = 'nyra:analytics:dedup:';

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

function buildEventFingerprint(event: string, payload: AnalyticsPayload, dedupKey?: string) {
  return dedupKey ? `${event}:${dedupKey}` : `${event}:${stableStringify(payload)}`;
}

function shouldTrackOnce(event: string, payload: AnalyticsPayload, ttlMs: number, dedupKey?: string) {
  if (typeof window === 'undefined') return true;
  try {
    const now = Date.now();
    const key = `${DEDUP_PREFIX}${buildEventFingerprint(event, payload, dedupKey)}`;
    const previousRaw = window.sessionStorage.getItem(key);
    const previous = previousRaw ? Number(previousRaw) : 0;
    if (Number.isFinite(previous) && previous > 0 && now - previous < ttlMs) return false;
    window.sessionStorage.setItem(key, String(now));
    return true;
  } catch {
    // Privacy mode or restricted storage should never break checkout/cart UX.
    return true;
  }
}

function pushGa4(event: string, payload: AnalyticsPayload) {
  if (!ENABLE_ANALYTICS) return;
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, payload);
    return;
  }
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event, ...payload });
  }
}

function pushPosthog(event: string, payload: AnalyticsPayload) {
  if (!ENABLE_ANALYTICS) return;
  if (typeof window === 'undefined') return;
  window.posthog?.capture?.(event, payload);
}

export function trackEvent(event: string, payload: AnalyticsPayload = {}) {
  pushGa4(event, payload);
  pushPosthog(event, payload);
}

export function trackEventOnce(
  event: string,
  payload: AnalyticsPayload = {},
  options?: { ttlMs?: number; dedupKey?: string }
) {
  const ttlMs = options?.ttlMs ?? 3000;
  if (!shouldTrackOnce(event, payload, ttlMs, options?.dedupKey)) return;
  trackEvent(event, payload);
}

function toTrackedItem(product: ProductLike, quantity = 1): TrackedItem {
  return {
    item_id: product.id,
    item_name: product.name,
    item_category: product.category?.name,
    price: product.price,
    quantity,
  };
}

export function trackViewProduct(product: ProductLike) {
  const item = toTrackedItem(product, 1);
  trackEventOnce(
    'view_item',
    {
      currency: 'XOF',
      value: product.price,
      items: [item],
    },
    { ttlMs: 120000, dedupKey: product.id }
  );
}

export function trackAddToCart(product: ProductLike, quantity = 1) {
  const item = toTrackedItem(product, quantity);
  trackEvent('add_to_cart', {
    currency: 'XOF',
    value: product.price * quantity,
    items: [item],
  });
}

export function trackBeginCheckout(items: TrackedItem[], total: number) {
  trackEventOnce(
    'begin_checkout',
    {
      currency: 'XOF',
      value: total,
      items,
    },
    {
      ttlMs: 10000,
      dedupKey: `${total}:${items.map((item) => `${item.item_id}:${item.quantity ?? 1}`).join('|')}`,
    }
  );
}

export function trackCheckoutStepView(step: number, stepLabel: string) {
  trackEventOnce(
    'checkout_step_view',
    { step, step_label: stepLabel },
    { ttlMs: 60000, dedupKey: `${step}` }
  );
}

export function trackCheckoutStepComplete(step: number, stepLabel: string) {
  trackEventOnce(
    'checkout_step_complete',
    { step, step_label: stepLabel },
    { ttlMs: 10000, dedupKey: `${step}` }
  );
}

export function trackCheckoutPaymentFailed(reason: 'declined' | 'timeout' | 'incomplete') {
  trackEvent('checkout_payment_failed', { reason });
}

export function trackCartAbandoned(items: TrackedItem[], total: number, reason: 'page_exit' | 'route_change') {
  trackEventOnce(
    'cart_abandoned',
    {
      currency: 'XOF',
      value: total,
      reason,
      items,
    },
    {
      ttlMs: 300000,
      dedupKey: `${reason}:${total}:${items.map((item) => `${item.item_id}:${item.quantity ?? 1}`).join('|')}`,
    }
  );
}

export function trackRemoveFromCart(product: ProductLike, quantity = 1) {
  const item = toTrackedItem(product, quantity);
  trackEvent('remove_from_cart', {
    currency: 'XOF',
    value: product.price * quantity,
    items: [item],
  });
}

export function toCheckoutTrackedItem(item: {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}) {
  return {
    item_id: item.productId,
    item_name: item.name,
    price: item.unitPrice,
    quantity: item.quantity,
  } satisfies TrackedItem;
}

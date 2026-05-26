import { requestJson } from './httpClient';
import type { CheckoutAccess } from '../../lib/checkoutAccess';
import { checkoutRequestHeaders, initCheckoutRequestHeaders } from '../../lib/checkoutAccess';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;

function ensureBaseUrl() {
  if (!STRAPI_URL) {
    throw new Error('VITE_STRAPI_URL est manquant. Configurez votre backend Strapi.');
  }
  return STRAPI_URL;
}

function url(path: string) {
  return `${ensureBaseUrl()}${path}`;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export type RemoteCartItem = { productId: string; quantity: number; id?: string; itemId?: string; variantId?: string };
export type RemoteWishlistItem = {
  id?: string;
  productId?: string;
  product?: { id?: string; slug?: string };
};
export type RemoteAddress = {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  isDefault?: boolean;
};

export type RemoteOrder = {
  id: string;
  createdAt: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  shippingAddress: {
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  items: Array<{ productId: string; name: string; unitPrice: number; quantity: number }>;
};

export type RemotePurchasedProductItem = {
  product?: {
    id?: string;
    slug?: string;
    name?: string;
    price?: number;
    image?: string;
    currency?: string;
  };
  productId?: string;
  productSlug?: string;
  productName?: string;
  totalQuantity?: number;
  totalSpent?: number;
  currency?: string;
  lastPurchasedAt?: string;
  lastOrderId?: string;
  orderCount?: number;
};

export type CheckoutInitInput = {
  customer: { firstName: string; lastName: string; email: string; phone: string };
  shippingAddress: {
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  billingSameAsShipping: boolean;
  items: Array<{ productId: string; quantity: number; variantId?: string }>;
};

export async function getCart(token: string) {
  const response = await requestJson<{
    items?: Array<{
      id?: string;
      itemId?: string;
      productId?: string;
      variantId?: string;
      quantity?: number;
      product?: { id?: string; slug?: string };
    }>;
  }>(url('/api/cart'), {
    method: 'GET',
    headers: authHeaders(token),
  });
  const items = Array.isArray(response.items)
    ? response.items
        .map((raw) => {
          const item = raw as Record<string, unknown>;
          const nestedVariant =
            item.variant && typeof item.variant === 'object'
              ? (item.variant as Record<string, unknown>).id ?? (item.variant as Record<string, unknown>).documentId
              : undefined;
          const variantRaw = item.variantId ?? item.variant_id ?? nestedVariant;
          const variantId =
            variantRaw !== undefined && variantRaw !== null && String(variantRaw).trim() !== ''
              ? String(variantRaw).trim()
              : undefined;
          const productNested = item.product && typeof item.product === 'object' ? (item.product as Record<string, unknown>) : undefined;
          const productId = String(
            item.productId ?? productNested?.id ?? productNested?.documentId ?? productNested?.slug ?? ''
          ).trim();
          return {
            id: (item.id ?? item.itemId) as string | undefined,
            itemId: (item.itemId ?? item.id) as string | undefined,
            productId,
            variantId,
            quantity: Number(item.quantity ?? 0) || 0,
          };
        })
        .filter((item) => Boolean(item.productId) && item.quantity > 0)
    : [];
  return { items };
}

export async function addCartItem(token: string, input: { productId: string; quantity: number; variantId?: string }) {
  const body: { productId: string; quantity: number; variantId?: string } = {
    productId: input.productId,
    quantity: input.quantity,
  };
  if (input.variantId) body.variantId = input.variantId;
  return requestJson<{ items: RemoteCartItem[] }>(url('/api/cart/items'), {
    method: 'POST',
    headers: authHeaders(token),
    body,
  });
}

export async function updateCartItem(token: string, itemId: string, input: { quantity: number }) {
  return requestJson<{ items: RemoteCartItem[] }>(url(`/api/cart/items/${itemId}`), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: input,
  });
}

export async function removeCartItem(token: string, itemId: string) {
  return requestJson<{ items: RemoteCartItem[] }>(url(`/api/cart/items/${itemId}`), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function getWishlist(token: string) {
  const response = await requestJson<{
    items?: RemoteWishlistItem[];
    products?: Array<{ id?: string; slug?: string }>;
    productIds?: string[];
    count?: number;
  }>(url('/api/me/wishlist'), {
    method: 'GET',
    headers: authHeaders(token),
  });
  const itemIdsFromItems = Array.isArray(response.items)
    ? response.items
        .flatMap((item) => [item.productId, item.product?.id, item.product?.slug])
        .filter((value): value is string => Boolean(value))
    : [];
  const itemIdsFromProducts = Array.isArray(response.products)
    ? response.products
        .flatMap((product) => [product.id, product.slug])
        .filter((value): value is string => Boolean(value))
    : [];
  const explicitIds = Array.isArray(response.productIds) ? response.productIds.filter(Boolean) : [];
  const productIds = Array.from(new Set([...explicitIds, ...itemIdsFromItems, ...itemIdsFromProducts]));
  return {
    items: Array.isArray(response.items) ? response.items : [],
    productIds,
    count: Number(response.count ?? productIds.length) || 0,
  };
}

export async function addWishlistItem(token: string, productId: string) {
  return requestJson<{ added?: boolean }>(url('/api/me/wishlist/items'), {
    method: 'POST',
    headers: authHeaders(token),
    body: { productId },
  });
}

export async function removeWishlistItem(token: string, productId: string) {
  return requestJson<{ removed?: boolean }>(url(`/api/me/wishlist/items/${productId}`), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function getAddresses(token: string) {
  const response = await requestJson<{ items?: RemoteAddress[]; addresses?: RemoteAddress[] }>(url('/api/me/addresses'), {
    method: 'GET',
    headers: authHeaders(token),
  });
  return {
    items: Array.isArray(response.items)
      ? response.items
      : Array.isArray(response.addresses)
        ? response.addresses
        : [],
  };
}

export async function createAddress(token: string, input: Omit<RemoteAddress, 'id'>) {
  return requestJson<RemoteAddress>(url('/api/me/addresses'), {
    method: 'POST',
    headers: authHeaders(token),
    body: input,
  });
}

export async function patchAddress(token: string, id: string, input: Partial<Omit<RemoteAddress, 'id'>>) {
  return requestJson<RemoteAddress>(url(`/api/me/addresses/${id}`), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: input,
  });
}

export async function deleteAddress(token: string, id: string) {
  return requestJson<{ success: boolean }>(url(`/api/me/addresses/${id}`), {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function setDefaultAddressRemote(token: string, id: string) {
  return requestJson<{ success: boolean }>(url(`/api/me/addresses/${id}/default`), {
    method: 'POST',
    headers: authHeaders(token),
  });
}

export async function getOrders(token: string) {
  const response = await requestJson<{ items?: RemoteOrder[]; orders?: RemoteOrder[] }>(url('/api/me/orders?page=1&pageSize=20'), {
    method: 'GET',
    headers: authHeaders(token),
  });
  return {
    items: Array.isArray(response.items)
      ? response.items
      : Array.isArray(response.orders)
        ? response.orders
        : [],
  };
}

export async function getViewedProducts(token: string) {
  const response = await requestJson<{
    items?: Array<{ productId?: string; product?: { id?: string; slug?: string } }>;
    products?: Array<{ productId?: string; id?: string; slug?: string }>;
    productIds?: string[];
  }>(
    url('/api/me/viewed-products'),
    {
      method: 'GET',
      headers: authHeaders(token),
    }
  );
  const idsFromItems = Array.isArray(response.items)
    ? response.items
        .flatMap((item) => [item.productId, item.product?.id, item.product?.slug])
        .filter((value): value is string => Boolean(value))
    : [];
  const idsFromProducts = Array.isArray(response.products)
    ? response.products
        .flatMap((product) => [product.productId, product.id, product.slug])
        .filter((value): value is string => Boolean(value))
    : [];
  const explicitIds = Array.isArray(response.productIds) ? response.productIds.filter(Boolean) : [];
  return {
    productIds: Array.from(new Set([...explicitIds, ...idsFromItems, ...idsFromProducts])),
  };
}

export async function pushViewedProduct(token: string, productId: string) {
  return requestJson<{ success: boolean }>(url('/api/me/viewed-products'), {
    method: 'POST',
    headers: authHeaders(token),
    body: { productId },
  });
}

export type CheckoutInitResponse = {
  checkoutId?: string;
  checkout_session_id?: string;
  /** Jeton pour les appels checkout invité (header X-Checkout-Token) */
  guestToken?: string;
};

export async function initCheckout(input: CheckoutInitInput, access: CheckoutAccess = {}) {
  return requestJson<CheckoutInitResponse>(url('/api/checkout/init'), {
    method: 'POST',
    headers: initCheckoutRequestHeaders(access),
    body: input,
  });
}

export async function confirmCheckout(
  checkoutId: string,
  input: { paymentMethod: string; paymentIntentId?: string; paymentId?: string },
  access: CheckoutAccess = {}
) {
  return requestJson<{ order?: { id?: string }; orderId?: string }>(url(`/api/checkout/${checkoutId}/confirm`), {
    method: 'POST',
    headers: checkoutRequestHeaders(access),
    body: input,
  });
}

export async function getPurchasedProducts(token: string) {
  const response = await requestJson<{
    items?: RemotePurchasedProductItem[];
    products?: Array<{ id?: string; slug?: string; name?: string; price?: number; image?: string }>;
    productIds?: string[];
    count?: number;
  }>(url('/api/me/purchased-products'), {
    method: 'GET',
    headers: authHeaders(token),
  });

  const items = Array.isArray(response.items) ? response.items : [];
  const fallbackItemsFromProducts = Array.isArray(response.products)
    ? response.products.map((product) => ({
        product,
        productId: product.id ?? product.slug ?? '',
        productSlug: product.slug ?? '',
        productName: product.name ?? '',
        totalQuantity: 0,
        totalSpent: 0,
        currency: 'XOF',
        orderCount: 0,
      }))
    : [];
  const normalizedItems = (items.length ? items : fallbackItemsFromProducts).filter(
    (item) => Boolean(item.productId || item.product?.id || item.productSlug || item.product?.slug)
  );

  return {
    items: normalizedItems,
    count: Number(response.count ?? normalizedItems.length) || 0,
  };
}

import imgTheNoir from 'figma:asset/4af3d60f9ef750f3824061de6d92bbf9e1e9c6ec.png';
import imgTheBlanc from 'figma:asset/35783a1903ef9b2d352590562e59c39ca57f8fb7.png';
import imgInfusion from 'figma:asset/fda277a5b54ab52183b7f0a4221f95fb4d48bfed.png';
import imgTheVert from 'figma:asset/2dbfcc0ed633c6982ef59109caf2de6926fabc20.png';
import imgBienEtre from 'figma:asset/6a3ac58fc7cd71342364354032a5815209cd40fc.png';
import type {
  CatalogPayload,
  UICategory,
  UIProduct,
  UIProductVariant,
  UITag,
} from '@/app/features/catalog/types';
import { requestJson } from './httpClient';

type StrapiEntity<T> = { id?: number | string; attributes?: T } & T;
type StrapiListResponse<T> = {
  data?: Array<StrapiEntity<T>>;
  meta?: {
    pagination?: { page?: number; pageSize?: number; pageCount?: number; total?: number };
  };
};
type StrapiMedia = { url?: string; formats?: Record<string, { url?: string }> };
type StrapiCategory = { name?: string; slug?: string; image?: StrapiMedia | { data?: StrapiEntity<StrapiMedia> } };
type StrapiTag = { name?: string; slug?: string };
type StrapiProduct = {
  name?: string;
  slug?: string;
  ingredients?: string;
  price?: number;
  compareAtPrice?: number;
  rating?: number;
  reviews?: number;
  stockQty?: number;
  inStock?: boolean;
  bgClass?: string;
  image?: StrapiMedia | { data?: StrapiEntity<StrapiMedia> };
  gallery?: Array<StrapiMedia | { data?: StrapiEntity<StrapiMedia> }> | { data?: Array<StrapiEntity<StrapiMedia>> };
  variants?:
    | Array<{
        id?: number | string;
        label?: string;
        size?: string;
        colorName?: string;
        colorHex?: string;
        price?: number;
        compareAtPrice?: number;
        stockQty?: number;
        inStock?: boolean;
      }>
    | {
        data?: Array<
          StrapiEntity<{
            label?: string;
            size?: string;
            colorName?: string;
            colorHex?: string;
            price?: number;
            compareAtPrice?: number;
            stockQty?: number;
            inStock?: boolean;
          }>
        >;
      };
  category?: StrapiEntity<StrapiCategory> | { data?: StrapiEntity<StrapiCategory> };
  tags?: Array<StrapiEntity<StrapiTag>> | { data?: Array<StrapiEntity<StrapiTag>> };
};

const SHOP_CATEGORY_SLUGS = new Set([
  'secret-de-nyra',
  'thes-bio',
  'tisanes',
  'herboristerie',
  'café',
  'cafés',
  'cafes',
  'cafe',
  'accessoires',
]);
const TEA_FAMILY_TAG_SLUGS = new Set(['the-noir', 'the-blanc', 'infusion', 'the-vert', 'bien-etre']);
const TEA_FAMILY_TAGS_DISPLAY_ORDER: Array<{ slug: string; defaultName: string }> = [
  { slug: 'the-noir', defaultName: 'The noir' },
  { slug: 'the-blanc', defaultName: 'The blanc' },
  { slug: 'infusion', defaultName: 'Infusion' },
  { slug: 'the-vert', defaultName: 'The vert' },
  { slug: 'bien-etre', defaultName: 'Bien-etre' },
];
const categoryImageBySlug: Record<string, string> = {
  'the-noir': imgTheNoir,
  'the-blanc': imgTheBlanc,
  infusion: imgInfusion,
  'the-vert': imgTheVert,
  'bien-etre': imgBienEtre,
};
const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;

function asEntity<T>(value: unknown): StrapiEntity<T> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  return value as StrapiEntity<T>;
}
function unwrapEntity<T>(value: unknown): StrapiEntity<T> | undefined {
  const entity = asEntity<T>(value);
  if (!entity) return undefined;
  if ('data' in entity && entity.data) return asEntity<T>(entity.data);
  return entity;
}
function unwrapEntityList<T>(value: unknown): Array<StrapiEntity<T>> {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => asEntity<T>(item)).filter(Boolean) as Array<StrapiEntity<T>>;
  const entity = asEntity<{ data?: Array<StrapiEntity<T>> }>(value);
  return Array.isArray(entity?.data) ? entity.data.map((item) => asEntity<T>(item)).filter(Boolean) as Array<StrapiEntity<T>> : [];
}
function readField<T>(entity: StrapiEntity<T> | undefined, key: keyof T): unknown {
  if (!entity) return undefined;
  const withAttributes = entity.attributes as Record<string, unknown> | undefined;
  if (withAttributes && key in withAttributes) return withAttributes[key as string];
  return (entity as Record<string, unknown>)[key as string];
}
const getString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const getNumber = (value: unknown, fallback = 0) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

function buildMediaUrl(media: unknown): string {
  const entity = unwrapEntity<StrapiMedia>(media);
  if (!entity) return '';
  const formats = readField(entity, 'formats') as StrapiMedia['formats'] | undefined;
  const preferred = formats?.medium?.url ?? formats?.small?.url ?? formats?.thumbnail?.url ?? getString(readField(entity, 'url'));
  if (!preferred) return '';
  if (/^https?:\/\//.test(preferred)) return preferred;
  return `${STRAPI_URL}${preferred}`;
}

function mapCategory(entity: StrapiEntity<StrapiCategory>): UICategory | null {
  const slug = getString(readField(entity, 'slug'));
  const name = getString(readField(entity, 'name'));
  if (!slug || !name) return null;
  return { slug, name, image: categoryImageBySlug[slug] ?? imgInfusion };
}

function mapProduct(entity: StrapiEntity<StrapiProduct>): UIProduct | null {
  const slug = getString(readField(entity, 'slug'));
  const name = getString(readField(entity, 'name'));
  const categoryEntity = unwrapEntity<StrapiCategory>(readField(entity, 'category'));
  const categorySlug = getString(readField(categoryEntity, 'slug')) || 'non-classe';
  if (!slug || !name) return null;
  const tags = unwrapEntityList<StrapiTag>(readField(entity, 'tags'))
    .map((tagEntity) => {
      const tagSlug = getString(readField(tagEntity, 'slug'));
      const tagName = getString(readField(tagEntity, 'name'));
      return tagSlug && tagName ? { slug: tagSlug, name: tagName } : null;
    })
    .filter(Boolean) as Array<{ slug: string; name: string }>;
  const galleryRaw = unwrapEntityList<StrapiMedia>(readField(entity, 'gallery'));
  const gallery = galleryRaw.map((media) => buildMediaUrl(media)).filter(Boolean);

  const variantEntities = unwrapEntityList<{
    label?: string;
    size?: string;
    colorName?: string;
    colorHex?: string;
    sku?: string;
    price?: number;
    compareAtPrice?: number;
    stockQty?: number;
    inStock?: boolean;
  }>(readField(entity, 'variants'));
  const variants: UIProductVariant[] = variantEntities
    .map((variantEntity) => {
      const label = getString(readField(variantEntity, 'label'));
      const size = getString(readField(variantEntity, 'size'));
      const colorName = getString(readField(variantEntity, 'colorName'));
      const veRecord = variantEntity as Record<string, unknown>;
      const documentId =
        getString(veRecord.documentId) || getString(readField(variantEntity, 'documentId')) || undefined;
      const strapiId =
        variantEntity.id != null && variantEntity.id !== '' ? String(variantEntity.id) : undefined;
      const sku = getString(readField(variantEntity, 'sku')) || undefined;
      const id = documentId ?? strapiId ?? sku ?? label ?? size ?? colorName ?? '';
      if (!id) return null;
      return {
        id,
        documentId,
        strapiId,
        sku,
        label: label || size || colorName || 'Variante',
        size: size || undefined,
        colorName: colorName || undefined,
        colorHex: getString(readField(variantEntity, 'colorHex')) || undefined,
        price: getNumber(readField(variantEntity, 'price'), 0) || undefined,
        compareAtPrice: getNumber(readField(variantEntity, 'compareAtPrice'), 0) || undefined,
        stockQty:
          getNumber(readField(variantEntity, 'stockQty'), 0) ||
          getNumber(readField(variantEntity, 'stock'), 0) ||
          undefined,
        inStock:
          (readField(variantEntity, 'inStock') as boolean | undefined) ??
          ((readField(variantEntity, 'isActive') as boolean | undefined) ?? true),
      };
    })
    .filter(Boolean) as UIProductVariant[];
  const mainImage = buildMediaUrl(readField(entity, 'image'));
  const entityRecord = entity as Record<string, unknown>;
  const documentId =
    getString(entityRecord.documentId) || getString(readField(entity, 'documentId')) || undefined;
  const strapiId = entity.id != null && entity.id !== '' ? String(entity.id) : undefined;

  return {
    id: slug,
    slug,
    documentId,
    strapiId,
    name,
    ingredients: getString(readField(entity, 'ingredients')),
    price: getNumber(readField(entity, 'price')),
    compareAtPrice: getNumber(readField(entity, 'compareAtPrice'), 0) || undefined,
    rating: getNumber(readField(entity, 'rating')),
    reviews: getNumber(readField(entity, 'reviews')),
    bgClass: 'bg-white',
    image: mainImage,
    gallery: [mainImage, ...gallery].filter(Boolean),
    stockQty: getNumber(readField(entity, 'stockQty'), 0) || undefined,
    inStock: (readField(entity, 'inStock') as boolean | undefined) ?? true,
    variants,
    category: { slug: categorySlug, name: getString(readField(categoryEntity, 'name'), categorySlug) },
    tags,
  };
}

const STRAPI_PRODUCTS_PAGE_SIZE = 100;

/** Strapi limite souvent à 25 entrées par page — on agrège toutes les pages. */
async function fetchAllStrapiProductEntities(signal: AbortSignal | undefined): Promise<Array<StrapiEntity<StrapiProduct>>> {
  const populate =
    'populate[category]=true&populate[image]=true&populate[gallery]=true&populate[tags]=true&populate[variants]=true';
  const all: Array<StrapiEntity<StrapiProduct>> = [];
  let page = 1;
  for (let safety = 0; safety < 200; safety++) {
    const url = `${STRAPI_URL}/api/products?pagination[page]=${page}&pagination[pageSize]=${STRAPI_PRODUCTS_PAGE_SIZE}&${populate}`;
    const json = await requestJson<StrapiListResponse<StrapiProduct>>(url, { signal, timeoutMs: 45_000 });
    const batch = json.data ?? [];
    all.push(...batch);
    const pageCount = json.meta?.pagination?.pageCount;
    if (typeof pageCount === 'number' && pageCount >= 1 && page >= pageCount) break;
    if (batch.length < STRAPI_PRODUCTS_PAGE_SIZE) break;
    page += 1;
  }
  return all;
}

function dedupeProductsBySlug(products: UIProduct[]): UIProduct[] {
  const bySlug = new Map<string, UIProduct>();
  for (const p of products) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, p);
  }
  return [...bySlug.values()];
}

export async function fetchCatalog(signal?: AbortSignal): Promise<CatalogPayload> {
  if (!STRAPI_URL) throw new Error('VITE_STRAPI_URL est manquante.');

  const [productEntities, categoriesJson] = await Promise.all([
    fetchAllStrapiProductEntities(signal),
    requestJson<StrapiListResponse<StrapiCategory>>(`${STRAPI_URL}/api/categories`, { signal, timeoutMs: 20_000 }),
  ]);

  let products = productEntities.map((item) => mapProduct(item)).filter(Boolean) as UIProduct[];
  products = dedupeProductsBySlug(products);
  const rawCategories = (categoriesJson.data ?? []).map((item) => mapCategory(item)).filter(Boolean) as UICategory[];
  const categories = rawCategories.filter((item) => SHOP_CATEGORY_SLUGS.has(item.slug));

  const tagMap = new Map<string, UITag>();
  rawCategories
    .filter((item) => TEA_FAMILY_TAG_SLUGS.has(item.slug))
    .forEach((item) => tagMap.set(item.slug, { slug: item.slug, name: item.name, image: categoryImageBySlug[item.slug] ?? imgInfusion }));
  products.forEach((product) => {
    product.tags.forEach((tag) => tagMap.set(tag.slug, { slug: tag.slug, name: tag.name, image: categoryImageBySlug[tag.slug] ?? imgInfusion }));
  });

  const tags = TEA_FAMILY_TAGS_DISPLAY_ORDER.map(({ slug, defaultName }) => {
    return tagMap.get(slug) ?? { slug, name: defaultName, image: categoryImageBySlug[slug] ?? imgInfusion };
  });

  return { products, categories, tags };
}

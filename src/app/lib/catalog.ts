import imgTheNoir from 'figma:asset/4af3d60f9ef750f3824061de6d92bbf9e1e9c6ec.png';
import imgTheBlanc from 'figma:asset/35783a1903ef9b2d352590562e59c39ca57f8fb7.png';
import imgInfusion from 'figma:asset/fda277a5b54ab52183b7f0a4221f95fb4d48bfed.png';
import imgTheVert from 'figma:asset/2dbfcc0ed633c6982ef59109caf2de6926fabc20.png';
import imgBienEtre from 'figma:asset/6a3ac58fc7cd71342364354032a5815209cd40fc.png';

type StrapiEntity<T> = {
  id?: number | string;
  attributes?: T;
} & T;

type StrapiListResponse<T> = {
  data?: Array<StrapiEntity<T>>;
};

type StrapiMedia = {
  url?: string;
  formats?: Record<string, { url?: string }>;
};

type StrapiCategory = {
  name?: string;
  slug?: string;
  image?: StrapiMedia | { data?: StrapiEntity<StrapiMedia> };
};

type StrapiProduct = {
  name?: string;
  slug?: string;
  ingredients?: string;
  price?: number;
  rating?: number;
  reviews?: number;
  bgClass?: string;
  image?: StrapiMedia | { data?: StrapiEntity<StrapiMedia> };
  category?: StrapiEntity<StrapiCategory> | { data?: StrapiEntity<StrapiCategory> };
};

export type UICategory = {
  slug: string;
  name: string;
  image: string;
};

export type UIProduct = {
  id: string;
  slug: string;
  name: string;
  ingredients: string;
  price: number;
  rating: number;
  reviews: number;
  bgClass: string;
  image: string;
  category: {
    slug: string;
    name: string;
  };
};

const categoryImageBySlug: Record<string, string> = {
  'the-noir': imgTheNoir,
  'the-blanc': imgTheBlanc,
  infusion: imgInfusion,
  'the-vert': imgTheVert,
  'bien-etre': imgBienEtre,
};

const bgClassByCategorySlug: Record<string, string> = {
  'the-noir': 'bg-[#F2EDF3]',
  'the-blanc': 'bg-[#FDFCE0]',
  infusion: 'bg-[#F8E7E9]',
  'the-vert': 'bg-[#EAF3EA]',
  'bien-etre': 'bg-[#FAF9F6]',
};

const DEFAULT_BG_CLASS = 'bg-[#F5F5F5]';

const STRAPI_URL = import.meta.env.VITE_STRAPI_URL;

function asEntity<T>(value: unknown): StrapiEntity<T> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  return value as StrapiEntity<T>;
}

function unwrapEntity<T>(value: unknown): StrapiEntity<T> | undefined {
  const entity = asEntity<T>(value);
  if (!entity) return undefined;
  if ('data' in entity && entity.data) {
    return asEntity<T>(entity.data);
  }
  return entity;
}

function readField<T>(entity: StrapiEntity<T> | undefined, key: keyof T): unknown {
  if (!entity) return undefined;
  const withAttributes = entity.attributes as Record<string, unknown> | undefined;
  if (withAttributes && key in withAttributes) return withAttributes[key as string];
  return (entity as Record<string, unknown>)[key as string];
}

function getString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function getNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function mediaFromUnknown(value: unknown): StrapiMedia | undefined {
  const entity = unwrapEntity<StrapiMedia>(value);
  if (!entity) return undefined;
  return {
    url: getString(readField(entity, 'url')),
    formats: (readField(entity, 'formats') as StrapiMedia['formats']) ?? undefined,
  };
}

function buildMediaUrl(media: unknown): string {
  const parsedMedia = mediaFromUnknown(media);
  if (!parsedMedia) return '';

  const preferred =
    parsedMedia.formats?.medium?.url ??
    parsedMedia.formats?.small?.url ??
    parsedMedia.formats?.thumbnail?.url ??
    parsedMedia.url ??
    '';

  if (!preferred) return '';
  if (/^https?:\/\//.test(preferred)) return preferred;
  return `${STRAPI_URL}${preferred}`;
}

function mapCategory(entity: StrapiEntity<StrapiCategory>): UICategory | null {
  const slug = getString(readField(entity, 'slug'));
  const name = getString(readField(entity, 'name'));
  if (!slug || !name) return null;

  return {
    slug,
    name,
    image: categoryImageBySlug[slug] ?? imgInfusion,
  };
}

function mapProduct(entity: StrapiEntity<StrapiProduct>): UIProduct | null {
  const slug = getString(readField(entity, 'slug'));
  const name = getString(readField(entity, 'name'));
  const ingredients = getString(readField(entity, 'ingredients'));
  const price = getNumber(readField(entity, 'price'));
  const rating = getNumber(readField(entity, 'rating'));
  const reviews = getNumber(readField(entity, 'reviews'));
  const categoryEntity = unwrapEntity<StrapiCategory>(readField(entity, 'category'));
  const categorySlug = getString(readField(categoryEntity, 'slug'));
  const categoryName = getString(readField(categoryEntity, 'name'));

  if (!slug || !name || !categorySlug) return null;

  return {
    id: slug,
    slug,
    name,
    ingredients,
    price,
    rating,
    reviews,
    bgClass:
      getString(readField(entity, 'bgClass')) ||
      bgClassByCategorySlug[categorySlug] ||
      DEFAULT_BG_CLASS,
    image: buildMediaUrl(readField(entity, 'image')),
    category: {
      slug: categorySlug,
      name: categoryName || categorySlug,
    },
  };
}

export type CatalogPayload = {
  products: UIProduct[];
  categories: UICategory[];
};

export async function fetchCatalog(): Promise<CatalogPayload> {
  if (!STRAPI_URL) {
    throw new Error('VITE_STRAPI_URL est manquante.');
  }

  const [productsRes, categoriesRes] = await Promise.all([
    fetch(
      `${STRAPI_URL}/api/products?populate[category]=true&populate[image]=true`
    ),
    fetch(`${STRAPI_URL}/api/categories`),
  ]);

  if (!productsRes.ok) {
    throw new Error("Impossible de charger les produits depuis Strapi.");
  }
  if (!categoriesRes.ok) {
    throw new Error("Impossible de charger les categories depuis Strapi.");
  }

  const productsJson = (await productsRes.json()) as StrapiListResponse<StrapiProduct>;
  const categoriesJson = (await categoriesRes.json()) as StrapiListResponse<StrapiCategory>;

  const products = (productsJson.data ?? [])
    .map((item) => mapProduct(item))
    .filter((item): item is UIProduct => Boolean(item));

  const categories = (categoriesJson.data ?? [])
    .map((item) => mapCategory(item))
    .filter((item): item is UICategory => Boolean(item));

  return { products, categories };
}

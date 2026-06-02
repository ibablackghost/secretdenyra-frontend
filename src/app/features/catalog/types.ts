export type UICategory = {
  slug: string;
  name: string;
  image: string;
};

export type UIProductVariant = {
  /** Id stable pour panier / checkout (documentId Strapi si disponible). */
  id: string;
  documentId?: string;
  strapiId?: string;
  label: string;
  name?: string;
  sku?: string;
  format?: string;
  size?: string;
  colorName?: string;
  colorHex?: string;
  price?: number;
  compareAtPrice?: number;
  stockQty?: number;
  stock?: number;
  inStock?: boolean;
  isDefault?: boolean;
  weightValue?: number | null;
  weightUnit?: 'g' | 'kg' | 'ml' | 'l' | 'piece' | null;
};

export type UIProduct = {
  id: string;
  slug: string;
  documentId?: string;
  strapiId?: string;
  name: string;
  ingredients: string;
  shortDescription?: string | null;
  description?: string | null;
  dosage?: string | null;
  infusionTime?: string | null;
  temperature?: string | null;
  origin?: string | null;
  botanicalName?: string | null;
  sourceUrl?: string | null;
  price: number;
  currency?: string;
  compareAtPrice?: number;
  rating: number;
  reviews: number;
  bgClass: string;
  image: string;
  gallery: string[];
  stockQty?: number;
  inStock?: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  variants: UIProductVariant[];
  category: {
    slug: string;
    name: string;
  };
  tags: Array<{
    slug: string;
    name: string;
  }>;
};

export type UITag = {
  slug: string;
  name: string;
  image: string;
};

export type CatalogPayload = {
  products: UIProduct[];
  categories: UICategory[];
  tags: UITag[];
};

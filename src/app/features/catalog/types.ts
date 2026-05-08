export type UICategory = {
  slug: string;
  name: string;
  image: string;
};

export type UIProductVariant = {
  id: string;
  label: string;
  size?: string;
  colorName?: string;
  colorHex?: string;
  price?: number;
  compareAtPrice?: number;
  stockQty?: number;
  inStock?: boolean;
};

export type UIProduct = {
  id: string;
  slug: string;
  name: string;
  ingredients: string;
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviews: number;
  bgClass: string;
  image: string;
  gallery: string[];
  stockQty?: number;
  inStock?: boolean;
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

/** Normalise pour recherche insensible aux accents / casse */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function productMatchesQuery(
  product: {
    id: string;
    name: string;
    ingredients: string;
    shortDescription?: string | null;
    description?: string | null;
    botanicalName?: string | null;
    origin?: string | null;
    category: string | { slug: string; name: string };
    tags?: Array<{ slug: string; name: string }>;
  },
  rawQuery: string
): boolean {
  const q = normalizeForSearch(rawQuery);
  if (!q) return true;
  const categoryText =
    typeof product.category === 'string'
      ? product.category
      : `${product.category.name} ${product.category.slug}`;
  const tagsText = (product.tags ?? [])
    .map((tag) => `${tag.name} ${tag.slug}`)
    .join(' ');
  const haystack = normalizeForSearch(
    `${product.name} ${product.ingredients} ${product.shortDescription ?? ''} ${product.description ?? ''} ${product.botanicalName ?? ''} ${product.origin ?? ''} ${categoryText} ${tagsText} ${product.id}`
  );
  return haystack.includes(q);
}

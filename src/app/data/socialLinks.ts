export type SocialLink = {
  id: 'tiktok' | 'instagram' | 'facebook';
  href: string;
  label: string;
  handle: string;
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'tiktok',
    href: 'https://www.tiktok.com/@secredenyra',
    label: 'TikTok',
    handle: '@secredenyra',
  },
  {
    id: 'instagram',
    href: 'https://www.instagram.com/les_secrets_de_nyra',
    label: 'Instagram',
    handle: '@les_secrets_de_nyra',
  },
  {
    id: 'facebook',
    href: 'https://www.facebook.com/profile.php?id=61587245802037',
    label: 'Facebook',
    handle: 'Les Secrets de Nyra',
  },
];

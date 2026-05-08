import { useEffect } from 'react';

type SeoInput = {
  title: string;
  description: string;
  canonicalPath?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  robots?: string;
};

const DEFAULT_SITE_NAME = 'Secret de Nyra';
const DEFAULT_DESCRIPTION = 'Boutique de thés et infusions bio premium.';

function upsertMetaByName(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertMetaByProperty(property: string, content: string) {
  let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

export function useSeo(input: SeoInput) {
  useEffect(() => {
    const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
    const canonical = input.canonicalPath ? `${siteUrl}${input.canonicalPath}` : `${siteUrl}${window.location.pathname}`;
    const fullTitle = `${input.title} | ${DEFAULT_SITE_NAME}`;
    const description = input.description || DEFAULT_DESCRIPTION;

    document.title = fullTitle;
    upsertMetaByName('description', description);
    upsertMetaByName('robots', input.robots || 'index,follow');

    upsertMetaByProperty('og:type', 'website');
    upsertMetaByProperty('og:site_name', DEFAULT_SITE_NAME);
    upsertMetaByProperty('og:title', input.ogTitle || fullTitle);
    upsertMetaByProperty('og:description', input.ogDescription || description);
    upsertMetaByProperty('og:url', canonical);
    if (input.ogImage) {
      upsertMetaByProperty('og:image', input.ogImage);
    }

    upsertCanonical(canonical);
  }, [input.title, input.description, input.canonicalPath, input.ogTitle, input.ogDescription, input.ogImage, input.robots]);
}

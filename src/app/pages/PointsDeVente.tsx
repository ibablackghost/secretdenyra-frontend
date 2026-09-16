import { RetailLocationsMap } from '../features/home/components/RetailLocationsMap';
import { useI18n } from '../hooks/useI18n';
import { useSeo } from '../hooks/useSeo';

export function PointsDeVente() {
  const { t } = useI18n();

  useSeo({
    title: t('seo.retail.title'),
    description: t('seo.retail.description'),
    canonicalPath: '/points-de-vente',
    robots: 'noindex,nofollow',
  });

  return (
    <div className="w-full pb-12">
      <RetailLocationsMap />
    </div>
  );
}

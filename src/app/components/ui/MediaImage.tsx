import { useState } from 'react';
import { resolveMediaUrl } from '../../lib/mediaUrl';

type MediaImageProps = {
  src: string | { url?: string } | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function MediaImage({ src, alt, className = '', fallbackClassName = '' }: MediaImageProps) {
  const [broken, setBroken] = useState(false);
  const resolved = resolveMediaUrl(src);

  if (!resolved || broken) {
    return (
      <div
        className={`flex items-center justify-center rounded-[10px] bg-gradient-to-br from-gray-100 to-gray-200 text-[10px] font-semibold uppercase tracking-wider text-gray-500 ${fallbackClassName}`}
      >
        Image indisponible
      </div>
    );
  }

  return <img src={resolved} alt={alt} className={className} onError={() => setBroken(true)} loading="lazy" />;
}

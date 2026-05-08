import { useState } from 'react';

type MediaImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function MediaImage({ src, alt, className = '', fallbackClassName = '' }: MediaImageProps) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div
        className={`flex items-center justify-center rounded-[10px] bg-gradient-to-br from-gray-100 to-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500 ${fallbackClassName}`}
      >
        Image indisponible
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} loading="lazy" />;
}

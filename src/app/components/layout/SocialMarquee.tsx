import { useEffect, useRef, useState } from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { SOCIAL_LINKS, type SocialLink } from '../../data/socialLinks';
import { useI18n } from '../../hooks/useI18n';
import './SocialMarquee.css';

const MIN_HALF_COPIES = 6;

function TikTokIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

function SocialIcon({ network }: { network: SocialLink['id'] }) {
  if (network === 'tiktok') return <TikTokIcon />;
  if (network === 'instagram') return <Instagram className="w-3.5 h-3.5" />;
  return <Facebook className="w-3.5 h-3.5" />;
}

function SocialMarqueeSegment({
  cta,
  hidden = false,
}: {
  cta: string;
  hidden?: boolean;
}) {
  return (
    <div className="sdn-social-marquee__segment" aria-hidden={hidden || undefined}>
      <span className="sdn-social-marquee__item pointer-events-none opacity-90">{cta}</span>
      <span className="sdn-social-marquee__dot" aria-hidden="true" />
      {SOCIAL_LINKS.map((link) => (
        <span key={link.id} className="inline-flex items-center gap-2">
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="sdn-social-marquee__item"
            aria-label={`${link.label} — ${link.handle}`}
            tabIndex={hidden ? -1 : undefined}
          >
            <span className="sdn-social-marquee__icon">
              <SocialIcon network={link.id} />
            </span>
            <span>{link.label}</span>
            <span className="font-normal normal-case tracking-normal opacity-80">{link.handle}</span>
          </a>
          <span className="sdn-social-marquee__dot" aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

export function SocialMarquee({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const cta = t('social.followUs');
  const containerRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [halfCopies, setHalfCopies] = useState(MIN_HALF_COPIES);

  useEffect(() => {
    const update = () => {
      const containerWidth = containerRef.current?.offsetWidth ?? 0;
      const segmentWidth = measureRef.current?.offsetWidth ?? 0;
      if (!containerWidth || !segmentWidth) return;
      const needed = Math.ceil(containerWidth / segmentWidth) + 2;
      setHalfCopies(Math.max(needed, MIN_HALF_COPIES));
    };

    update();
    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    if (measureRef.current) observer.observe(measureRef.current);
    return () => observer.disconnect();
  }, [cta]);

  const segments = Array.from({ length: halfCopies * 2 }, (_, index) => index);

  return (
    <section
      ref={containerRef}
      className={`sdn-social-marquee ${className}`.trim()}
      aria-label={t('social.marqueeLabel')}
    >
      <div className="sdn-social-marquee__measure" aria-hidden="true">
        <div ref={measureRef}>
          <SocialMarqueeSegment cta={cta} hidden />
        </div>
      </div>
      <div className="sdn-social-marquee__track">
        {segments.map((index) => (
          <SocialMarqueeSegment
            key={index}
            cta={cta}
            hidden={index >= halfCopies}
          />
        ))}
      </div>
    </section>
  );
}

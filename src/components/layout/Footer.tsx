import { useLocale } from '../../hooks/useLocale';

export const Footer = () => {
  const { t } = useLocale();

  const FOOTER_LINKS = [
    t('footer.manifesto'),
    t('footer.archive'),
    t('footer.ethics'),
    t('footer.privacy'),
    t('footer.contact'),
  ];

  return (
    <footer className="py-14 px-8 md:px-14">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-baseline gap-8 md:gap-16 mb-10">
          <div className="shrink-0">
            <span className="font-serif text-base font-bold italic tracking-tight text-butter-text">Butter</span>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            {FOOTER_LINKS.map((link, i) => (
              <a
                key={link}
                href="#"
                className="transition-colors duration-200 hover:text-butter-text"
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.03em',
                  color: i === 0 ? 'var(--color-butter-primary)' : 'var(--color-butter-muted)',
                  fontStyle: i === 0 ? 'italic' : 'normal',
                }}
              >
                {link}
              </a>
            ))}
          </div>
        </div>
        <div
          className="pt-7 flex flex-col md:flex-row md:justify-between md:items-center gap-2"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
        >
          <p style={{ fontSize: '11px', color: 'var(--color-butter-muted)', letterSpacing: '0.02em' }}>
            © 2024 Butter.{' '}
            <em style={{ fontStyle: 'italic' }}>{t('footer.tagline')}</em>
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(122,112,104,0.5)', letterSpacing: '0.04em' }}>
            {t('footer.quiet')}
          </p>
        </div>
      </div>
    </footer>
  );
};

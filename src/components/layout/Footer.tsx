const FOOTER_LINKS = ['The Manifesto', 'Library Archive', 'Journaling Ethics', 'Privacy', 'Contact'] as const;

export const Footer = () => (
  <footer className="py-14 px-8 md:px-14">
    <div className="max-w-7xl mx-auto">

      {/* 상단: 로고 + 링크 */}
      <div className="flex flex-col md:flex-row md:items-baseline gap-8 md:gap-16 mb-10">

        {/* 로고 */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 bg-butter-primary rounded-full flex items-center justify-center text-white font-serif italic text-xs">
            B
          </div>
          <span className="font-serif text-base font-semibold tracking-tight">Butter</span>
        </div>

        {/* 링크 */}
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

      {/* 하단 구분 + 카피라이트 */}
      <div
        className="pt-7 flex flex-col md:flex-row md:justify-between md:items-center gap-2"
        style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
      >
        <p style={{ fontSize: '11px', color: 'var(--color-butter-muted)', letterSpacing: '0.02em' }}>
          © 2024 Butter.{' '}
          <em style={{ fontStyle: 'italic' }}>Curating the slow reading movement.</em>
        </p>
        <p style={{ fontSize: '11px', color: 'rgba(122,112,104,0.5)', letterSpacing: '0.04em' }}>
          A quiet place on the internet.
        </p>
      </div>

    </div>
  </footer>
);

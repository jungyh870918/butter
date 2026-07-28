import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale';
import { SUPPORT_EMAIL } from '../legal/LegalPage';

export const Footer = () => {
  const { t } = useLocale();

  // ⚠️ 스토어 심사에서 개인정보처리방침 링크는 실제로 열려야 한다.
  //    내용이 없는 항목(선언문·기록보관함 등)은 죽은 링크를 두지 않고 제거했다.
  const FOOTER_LINKS = [
    { label: t('footer.privacy'), to: '/privacy' },
    { label: t('footer.deletion'), to: '/account-deletion' },
    { label: t('footer.support'), to: '/support' },
  ];

  return (
    <footer className="py-14 px-8 md:px-14">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-baseline gap-8 md:gap-16 mb-10">
          <div className="shrink-0">
            <span className="font-serif text-base font-bold italic tracking-tight text-butter-text">Butter</span>
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="transition-colors duration-200 hover:text-butter-text"
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.03em',
                  color: 'var(--color-butter-muted)',
                }}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="transition-colors duration-200 hover:text-butter-text"
              style={{ fontSize: '12px', letterSpacing: '0.03em', color: 'var(--color-butter-muted)' }}
            >
              {t('footer.contact')}
            </a>
          </div>
        </div>
        {/* 콜로폰 — 페이지마다 흩어져 있던 REF 코드를 여기 한 곳으로 모았다.
            헤더 안에 있으면 조작 가능한 UI 메타데이터처럼 읽히지만,
            푸터의 발행 표식 자리에 있으면 인쇄물의 판권 표시처럼 읽힌다. */}
        <p
          className="uppercase mb-5"
          style={{
            fontSize: '9px',
            letterSpacing: '0.22em',
            color: 'var(--color-butter-muted)',
            opacity: 0.4,
          }}
        >
          {t('footer.colophon')}
        </p>

        <div
          className="pt-7 flex flex-col md:flex-row md:justify-between md:items-center gap-2"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
        >
          <p style={{ fontSize: '11px', color: 'var(--color-butter-muted)', letterSpacing: '0.02em' }}>
            © 2026 Butter.{' '}
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

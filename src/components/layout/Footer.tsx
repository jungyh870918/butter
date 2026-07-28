import { Link } from 'react-router-dom';
import { useLocale } from '../../hooks/useLocale';
import { SUPPORT_EMAIL } from '../legal/LegalPage';

export const Footer = () => {
  const { t } = useLocale();

  // 잡지 느낌의 목차 항목 — 아직 내용이 없어 링크는 걸지 않는다.
  const FOOTER_LABELS = [
    t('footer.manifesto'),
    t('footer.archive'),
    t('footer.ethics'),
  ];

  // ⚠️ 스토어 심사에서 개인정보처리방침 링크는 실제로 열려야 한다.
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
            {FOOTER_LABELS.map((label, i) => (
              <span
                key={label}
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.03em',
                  color: i === 0 ? 'var(--color-butter-primary)' : 'var(--color-butter-muted)',
                  fontStyle: i === 0 ? 'italic' : 'normal',
                }}
              >
                {label}
              </span>
            ))}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="transition-colors duration-200 hover:text-butter-text"
              style={{ fontSize: '12px', letterSpacing: '0.03em', color: 'var(--color-butter-muted)' }}
            >
              {t('footer.contact')}
            </a>
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="transition-colors duration-200 hover:text-butter-text"
                style={{ fontSize: '12px', letterSpacing: '0.03em', color: 'var(--color-butter-muted)' }}
              >
                {link.label}
              </Link>
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

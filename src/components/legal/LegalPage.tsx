import { Link } from 'react-router-dom';

// ── 법적 고지 페이지 공용 레이아웃 ─────────────────────────────────────────
// 개인정보처리방침 / 계정삭제 안내가 함께 쓴다.
//
// ⚠️ 이 페이지들은 로그인 없이 열려야 한다. 스토어 심사자가 브라우저에서
//    바로 확인하므로 RootLayout(인증 네비게이션) 밖의 독립 라우트로 둔다.
// ⚠️ 심사자의 언어를 가릴 수 없으므로 한국어·영어를 함께 표기한다.

// ⚠️ TODO: 실제 지원 이메일로 교체할 것. 스토어 등록정보의 연락처와 일치해야 함.
export const SUPPORT_EMAIL = 'jungyh870918@gmail.com';
export const APP_NAME = 'Butter';
export const DEVELOPER_NAME = 'Butter';

/** 최종 개정일 — 내용을 고치면 반드시 함께 갱신할 것. */
export const LAST_UPDATED = '2026-07-28';

export const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-9">
    <h2
      className="uppercase tracking-[0.14em] mb-3 pb-2"
      style={{
        fontSize: '10px',
        color: 'var(--color-butter-muted)',
        borderBottom: '1px solid var(--color-butter-rule)',
      }}
    >
      {title}
    </h2>
    {children}
  </section>
);

/** 본문 (한국어) */
export const P = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-3" style={{ fontSize: '14px', lineHeight: 1.75, color: 'var(--color-butter-text)' }}>
    {children}
  </p>
);

/** 영문 병기 — 한 톤 옅게 */
export const Sub = ({ children }: { children: React.ReactNode }) => (
  <p className="mb-4" style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--color-butter-muted)' }}>
    {children}
  </p>
);

export const List = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="mb-4 space-y-1.5">
    {items.map((it, i) => (
      <li
        key={i}
        className="flex items-start gap-2"
        style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--color-butter-text)' }}
      >
        <span style={{ opacity: 0.45 }}>·</span>
        <span>{it}</span>
      </li>
    ))}
  </ul>
);

export const MailLink = ({ subject }: { subject?: string }) => (
  <a
    href={`mailto:${SUPPORT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`}
    style={{ color: 'var(--color-butter-primary)' }}
  >
    {SUPPORT_EMAIL}
  </a>
);

interface LegalPageProps {
  titleKo: string;
  titleEn: string;
  children: React.ReactNode;
}

export const LegalPage = ({ titleKo, titleEn, children }: LegalPageProps) => (
  <div
    className="min-h-screen"
    style={{ background: 'var(--color-butter-bg)', paddingTop: 'var(--safe-top)' }}
  >
    <div
      className="px-6 md:px-12 py-14 max-w-2xl mx-auto"
      style={{ paddingBottom: 'calc(3.5rem + var(--safe-bottom))' }}
    >
      <Link
        to="/"
        className="font-serif italic font-bold tracking-tight"
        style={{ fontSize: '1.15rem', color: 'var(--color-butter-text)', textDecoration: 'none' }}
      >
        Butter
      </Link>

      <h1 className="font-serif mt-8 mb-2" style={{ fontSize: '2.2rem', lineHeight: 1.15 }}>
        {titleKo}
      </h1>
      <p
        className="font-serif italic mb-3"
        style={{ fontSize: '1.05rem', color: 'var(--color-butter-muted)' }}
      >
        {titleEn}
      </p>
      <p
        className="uppercase tracking-[0.14em] mb-10"
        style={{ fontSize: '10px', color: 'var(--color-butter-muted)', opacity: 0.6 }}
      >
        최종 개정일 / Last updated — {LAST_UPDATED}
      </p>

      {children}

      <div
        className="pt-6 flex flex-wrap gap-x-5 gap-y-2 items-center"
        style={{ borderTop: '1px solid var(--color-butter-rule)' }}
      >
        <span className="font-serif italic" style={{ fontSize: '12.5px', color: 'var(--color-butter-muted)' }}>
          문의 / Contact: <MailLink />
        </span>
        <Link
          to="/privacy"
          style={{ fontSize: '11px', color: 'var(--color-butter-primary)', letterSpacing: '0.04em' }}
        >
          개인정보처리방침
        </Link>
        <Link
          to="/account-deletion"
          style={{ fontSize: '11px', color: 'var(--color-butter-primary)', letterSpacing: '0.04em' }}
        >
          계정 삭제
        </Link>
        <Link
          to="/support"
          style={{ fontSize: '11px', color: 'var(--color-butter-primary)', letterSpacing: '0.04em' }}
        >
          고객 지원
        </Link>
      </div>
    </div>
  </div>
);

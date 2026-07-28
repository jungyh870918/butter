import { Link } from 'react-router-dom';
import {
  LegalPage, Section, P, Sub, List, MailLink,
  APP_NAME, DEVELOPER_NAME,
} from '../legal/LegalPage';

// ── 계정 삭제 안내 (공개 페이지) ────────────────────────────────────────────
// Google Play 정책이 요구하는 3요건을 모두 담는다:
//   ① 앱 이름과 개발자명
//   ② 계정 삭제를 요청하는 방법
//   ③ 삭제되는 데이터 / 보관되는 데이터와 그 기간

export const AccountDeletion = () => {
  return (
    <LegalPage titleKo="계정 및 데이터 삭제" titleEn="Account & Data Deletion">
      {/* ① 앱 / 개발자 */}
      <Section title="앱 · 개발자 / App & Developer">
        <P>
          앱 이름: <strong>{APP_NAME}</strong> · 개발자: <strong>{DEVELOPER_NAME}</strong>
        </P>
        <Sub>
          App name: <strong>{APP_NAME}</strong> · Developer: <strong>{DEVELOPER_NAME}</strong>
        </Sub>
      </Section>

      {/* ② 삭제 방법 */}
      <Section title="삭제 방법 / How to request deletion">
        <P>
          <strong>방법 1 — 앱에서 직접 삭제 (즉시 처리)</strong>
          <br />
          앱에 로그인한 뒤 <strong>설정 → 계정 삭제 → 내 계정 삭제하기</strong> 를 선택하고
          비밀번호를 입력하면 즉시 영구 삭제됩니다.
        </P>
        <Sub>
          <strong>Option 1 — In the app (immediate)</strong>
          <br />
          Sign in, then go to <strong>Settings → Delete account</strong> and confirm with your
          password. Your account is deleted immediately and permanently.
        </Sub>

        <P>
          <strong>방법 2 — 이메일 요청</strong>
          <br />
          앱에 접근할 수 없는 경우 <MailLink subject="Butter account deletion request" /> 로 가입
          아이디와 함께 삭제를 요청해 주세요. 본인 확인 후 <strong>30일 이내</strong>에 처리해
          드립니다.
        </P>
        <Sub>
          <strong>Option 2 — By email</strong>
          <br />
          If you cannot access the app, email{' '}
          <MailLink subject="Butter account deletion request" /> with your username. We will
          verify and complete the deletion within <strong>30 days</strong>.
        </Sub>
      </Section>

      {/* ③ 삭제되는 데이터 */}
      <Section title="삭제되는 데이터 / What is deleted">
        <P>계정을 삭제하면 아래 항목이 모두 영구 삭제되며 복구할 수 없습니다.</P>
        <List
          items={[
            '계정 및 로그인 정보 (아이디, 비밀번호 해시, 표시 이름·아바타)',
            '모든 저널 기록 (본문, 감정, 강도, 인상 깊은 구절, 연결된 책 정보)',
            '모든 감정 기록 (Emotion logs)',
            '내 책장에 담은 책 목록',
            '자동 생성된 독서 프로파일 (추출된 주제·감정·인용 문구)',
          ]}
        />
        <Sub>
          Deleting your account permanently removes: your account and login credentials, all
          journal entries, all emotion logs, your bookshelf, and your generated reading profile.
          None of this can be recovered.
        </Sub>
      </Section>

      {/* 보관 기간 */}
      <Section title="보관 기간 / Retention">
        <P>
          위 데이터는 삭제 요청 시 <strong>즉시</strong> 운영 데이터베이스에서 제거됩니다. 다만 장애
          복구용 <strong>백업 스냅샷</strong>에는 최대 <strong>30일</strong>까지 남아 있을 수 있으며,
          해당 기간이 지나면 자동으로 완전히 삭제됩니다. 법령상 보관 의무가 있는 정보는 해당 법령이
          정한 기간 동안만 보관합니다.
        </P>
        <Sub>
          Data is removed from the live database <strong>immediately</strong>. Backup snapshots may
          retain it for up to <strong>30 days</strong>, after which it is purged automatically.
          Information we are legally required to keep is retained only for the period required by
          law.
        </Sub>
        <P>
          수집·이용 전반에 관한 내용은{' '}
          <Link to="/privacy" style={{ color: 'var(--color-butter-primary)' }}>
            개인정보처리방침
          </Link>
          을 참고하세요.
        </P>
      </Section>
    </LegalPage>
  );
};

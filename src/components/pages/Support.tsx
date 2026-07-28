import { Link } from 'react-router-dom';
import {
  LegalPage, Section, P, Sub, List, MailLink,
  APP_NAME, DEVELOPER_NAME,
} from '../legal/LegalPage';

// ── 고객 지원 (공개 페이지) ─────────────────────────────────────────────────
// App Store Connect 의 **지원 URL(Support URL)** 은 필수 항목이고,
// 심사자가 실제로 열어본다. 앱 홈으로 연결해두면 "지원 정보가 없다"고 지적받을 수 있어
// 문의 수단·응답 시간·자주 묻는 질문을 담은 전용 페이지를 둔다.

export const Support = () => {
  return (
    <LegalPage titleKo="고객 지원" titleEn="Support">
      <Section title="문의 / Contact">
        <P>
          <strong>{APP_NAME}</strong> 를 쓰시다가 궁금한 점이나 문제가 있으면 아래로 연락해 주세요.
        </P>
        <List
          items={[
            <>문의 이메일: <MailLink subject="Butter 문의" /></>,
            <>개발자: <strong>{DEVELOPER_NAME}</strong></>,
          ]}
        />
        <P>
          보내주신 문의는 <strong>영업일 기준 1~2일 이내</strong>에 답변드립니다. 버그 제보, 개선
          제안, 계정 관련 요청 모두 환영합니다.
        </P>
        <Sub>
          Questions or problems? Email <MailLink subject="Butter support" />. We reply within
          1–2 business days. Bug reports, feature suggestions, and account requests are all
          welcome.
        </Sub>
      </Section>

      <Section title="자주 묻는 질문 / FAQ">
        <P>
          <strong>Q. 내가 쓴 기록을 다른 사람이 볼 수 있나요?</strong>
          <br />
          아니요. Butter에는 피드·팔로우·좋아요가 없고, 기록을 공개하는 수단 자체가 없습니다.
          작성한 기록은 본인만 볼 수 있습니다. (책 소개를 링크로 공유하는 기능은 있지만,
          그 링크에는 책 정보만 담기고 회원님의 기록은 포함되지 않습니다.)
        </P>
        <Sub>
          <strong>Q. Can anyone else see my entries?</strong>
          <br />
          No. Butter has no feed, followers, or likes, and there is no way to publish an
          entry — your writing is visible only to you. (You can share a link to a book's
          info page, but that link contains book details only, never your writing.)
        </Sub>

        <P>
          <strong>Q. 회원가입은 어떻게 하나요?</strong>
          <br />
          별도 가입 절차가 없습니다. 로그인 화면에서 원하는 아이디와 비밀번호를 입력하면 그 계정이
          자동으로 만들어집니다. 이메일 주소는 받지 않습니다.
        </P>
        <Sub>
          <strong>Q. How do I sign up?</strong>
          <br />
          There is no separate sign-up. Enter a username and password on the login screen and the
          account is created automatically. We do not ask for an email address.
        </Sub>

        <P>
          <strong>Q. 비밀번호를 잊어버렸어요.</strong>
          <br />
          이메일 주소를 수집하지 않기 때문에 자동 비밀번호 재설정은 제공하지 않습니다.{' '}
          <MailLink subject="Butter 비밀번호 문의" /> 로 가입 아이디와 함께 연락해 주세요.
        </P>
        <Sub>
          <strong>Q. I forgot my password.</strong>
          <br />
          Because we don't collect email addresses, there is no automatic reset. Please contact{' '}
          <MailLink subject="Butter password help" /> with your username.
        </Sub>

        <P>
          <strong>Q. 계정을 삭제하고 싶어요.</strong>
          <br />
          앱에서 <strong>설정 → 계정 삭제</strong> 로 즉시 삭제할 수 있습니다. 자세한 내용은{' '}
          <Link to="/account-deletion" style={{ color: 'var(--color-butter-primary)' }}>
            계정 및 데이터 삭제
          </Link>{' '}
          페이지를 참고하세요.
        </P>
        <Sub>
          <strong>Q. How do I delete my account?</strong>
          <br />
          In the app: <strong>Settings → Delete account</strong>. See the{' '}
          <Link to="/account-deletion" style={{ color: 'var(--color-butter-primary)' }}>
            account deletion page
          </Link>{' '}
          for details.
        </Sub>
      </Section>

      <Section title="개인정보 / Privacy">
        <P>
          수집하는 정보와 처리 방식은{' '}
          <Link to="/privacy" style={{ color: 'var(--color-butter-primary)' }}>
            개인정보처리방침
          </Link>
          에 정리되어 있습니다.
        </P>
        <Sub>
          See the{' '}
          <Link to="/privacy" style={{ color: 'var(--color-butter-primary)' }}>
            privacy policy
          </Link>{' '}
          for what we collect and how it is handled.
        </Sub>
      </Section>
    </LegalPage>
  );
};

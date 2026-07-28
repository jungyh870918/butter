import { Link } from 'react-router-dom';
import {
  LegalPage, Section, P, Sub, List, MailLink,
  APP_NAME, DEVELOPER_NAME,
} from '../legal/LegalPage';

// ── 개인정보처리방침 (공개 페이지) ──────────────────────────────────────────
// ⚠️ 이 문서의 내용은 Play Console "데이터 보안" 양식 / App Store "앱 개인정보 보호"
//    답변과 **정확히 일치해야 한다.** 불일치는 대표적인 반려 사유.
//
// 현재 코드 기준 사실관계 (바뀌면 이 문서도 함께 고칠 것):
//   · 수집: 아이디/비밀번호해시/표시이름/아바타URL, 저널 기록, 감정 로그, 책장, 독서 프로파일
//   · 이메일·전화번호·실명·위치·연락처·사진 등은 수집하지 않음
//   · 광고 없음 / 분석·추적 SDK 없음 / 카메라·마이크·위치 권한 없음
//   · 제3자 전송: OpenAI(저널 본문·구절), Google Books·Kakao(검색어), DiceBear(아이디)
//   · 커뮤니티 기능 제거됨 → 다른 이용자에게 공개되는 데이터 없음

export const Privacy = () => {
  return (
    <LegalPage titleKo="개인정보처리방침" titleEn="Privacy Policy">
      <Section title="개요 / Overview">
        <P>
          <strong>{APP_NAME}</strong>(이하 "앱")은 독서 기록을 남기는 <strong>개인용</strong>{' '}
          앱입니다. 개발자 <strong>{DEVELOPER_NAME}</strong>은 이용자가 남긴 기록을 존중하며,
          서비스 제공에 꼭 필요한 최소한의 정보만 처리합니다.
        </P>
        <Sub>
          {APP_NAME} is a <strong>private</strong> reading journal. We process only the minimum
          information required to run the service.
        </Sub>
        <P>
          앱에는 <strong>광고가 없고</strong>, 분석·추적 도구를 사용하지 않으며, 이용자의 기록을{' '}
          <strong>판매하거나 광고 목적으로 이용하지 않습니다.</strong> 이용자가 쓴 기록은{' '}
          <strong>다른 이용자에게 공개되지 않습니다.</strong>
        </P>
        <Sub>
          No ads, no analytics or tracking SDKs. We never sell your data or use it for
          advertising. Your entries are never visible to other users.
        </Sub>
      </Section>

      <Section title="수집하는 정보 / What we collect">
        <P>앱은 아래 정보만 수집합니다.</P>
        <List
          items={[
            <><strong>계정 정보</strong> — 아이디, 비밀번호(단방향 해시로만 저장), 표시 이름, 자동 생성 아바타 이미지 주소</>,
            <><strong>저널 기록</strong> — 본문, 선택한 감정과 강도, 인상 깊은 구절, 함께 기록한 책의 제목·저자·표지</>,
            <><strong>감정 기록</strong> — 날짜별 감정과 강도</>,
            <><strong>책장</strong> — 내가 담아둔 책 목록</>,
            <><strong>독서 프로파일</strong> — 저널 기록에서 자동 추출된 주제·감정 경향·짧은 인용 구절</>,
          ]}
        />
        <P>
          <strong>수집하지 않는 것:</strong> 이메일 주소, 전화번호, 실명, 생년월일, 위치 정보,
          연락처, 사진·파일, 광고 식별자. 앱은 카메라·마이크·위치 권한을{' '}
          <strong>요청하지 않습니다.</strong>
        </P>
        <Sub>
          We collect: account credentials (password stored only as a one-way hash), your journal
          entries, emotion logs, bookshelf, and a generated reading profile. We do{' '}
          <strong>not</strong> collect email, phone number, real name, date of birth, location,
          contacts, photos, or advertising identifiers, and the app requests no camera,
          microphone, or location permissions.
        </Sub>
      </Section>

      <Section title="이용 목적 / How we use it">
        <List
          items={[
            '로그인 및 본인 확인',
            '작성한 기록의 저장·조회·수정·삭제',
            '감정 흐름 시각화 등 앱 기능 제공',
            '기록을 바탕으로 한 회고 질문·독서 프로파일 생성',
            '오류 대응 및 서비스 유지',
          ]}
        />
        <Sub>
          Authentication; storing and displaying your entries; app features such as emotion
          visualisation; generating reflection prompts and your reading profile; and maintaining
          the service.
        </Sub>
      </Section>

      <Section title="제3자 전송 / Third parties">
        <P>
          앱은 아래 서비스에 필요한 범위의 데이터를 전송합니다. 이용자 정보를 광고·마케팅 목적으로
          제공하는 곳은 <strong>없습니다.</strong>
        </P>
        <List
          items={[
            <>
              <strong>OpenAI</strong> — 회고 질문과 독서 프로파일 생성을 위해{' '}
              <strong>저널 본문과 인상 깊은 구절이 전송됩니다.</strong> 계정 아이디 등 식별 정보는
              함께 보내지 않습니다.
            </>,
            <><strong>Google Books · Kakao</strong> — 책 검색·정보 조회. <strong>검색어와 책 정보만</strong> 전송되며 개인 기록은 전송되지 않습니다.</>,
            <><strong>DiceBear</strong> — 기본 아바타 이미지 생성. 아이디가 이미지 주소에 포함됩니다.</>,
            <><strong>Neon (데이터베이스) · Railway · Vercel (호스팅)</strong> — 데이터 저장 및 서비스 운영을 위한 인프라.</>,
          ]}
        />
        <Sub>
          <strong>OpenAI</strong> receives your journal text and highlighted passages to generate
          reflection prompts and your reading profile (no account identifiers are sent).{' '}
          <strong>Google Books</strong> and <strong>Kakao</strong> receive only search terms and
          book data. <strong>DiceBear</strong> receives your username to generate a default
          avatar. <strong>Neon, Railway and Vercel</strong> host the database and application.
          None of these are advertising partners.
        </Sub>
      </Section>

      <Section title="보관 및 삭제 / Retention & deletion">
        <P>
          기록은 계정이 유지되는 동안 보관되며, 이용자가 언제든지 개별 기록을 삭제하거나 계정 전체를
          삭제할 수 있습니다. 계정을 삭제하면 위에 적은 모든 데이터가{' '}
          <strong>즉시 영구 삭제</strong>되고 복구할 수 없습니다.
        </P>
        <P>
          삭제 방법과 항목별 상세 내용은{' '}
          <Link to="/account-deletion" style={{ color: 'var(--color-butter-primary)' }}>
            계정 및 데이터 삭제
          </Link>{' '}
          페이지를 참고하세요. 장애 복구용 <strong>백업 스냅샷</strong>에는 최대{' '}
          <strong>30일</strong>까지 남아 있을 수 있으며 이후 자동으로 완전히 삭제됩니다.
        </P>
        <Sub>
          Data is kept while your account exists. You can delete individual entries or your entire
          account at any time — deletion is immediate and permanent. See the{' '}
          <Link to="/account-deletion" style={{ color: 'var(--color-butter-primary)' }}>
            account deletion page
          </Link>
          . Backup snapshots may retain data for up to 30 days before being purged automatically.
        </Sub>
      </Section>

      <Section title="보안 / Security">
        <P>
          비밀번호는 <strong>bcrypt 단방향 해시</strong>로만 저장되어 개발자도 원문을 알 수 없습니다.
          앱과 서버 사이의 통신은 <strong>HTTPS로 암호화</strong>되며, 로그인 상태는 만료 기한이 있는
          토큰으로 관리됩니다.
        </P>
        <Sub>
          Passwords are stored only as bcrypt one-way hashes — not even the developer can read
          them. All traffic between the app and the server is encrypted over HTTPS, and sessions
          use expiring tokens.
        </Sub>
      </Section>

      <Section title="이용자의 권리 / Your rights">
        <P>
          이용자는 언제든지 자신의 기록을 조회·수정·삭제할 수 있고, 계정 삭제로 모든 데이터를 지울 수
          있습니다. 그 밖에 개인정보 처리에 관해 문의하거나 이의를 제기하려면 <MailLink /> 로
          연락해 주세요.
        </P>
        <Sub>
          You may access, correct, or delete your data at any time, and delete your account to
          remove all of it. For any other request regarding your personal data, contact{' '}
          <MailLink />.
        </Sub>
      </Section>

      <Section title="아동의 개인정보 / Children">
        <P>
          앱은 <strong>만 14세 미만 아동</strong>을 대상으로 하지 않으며, 아동의 개인정보를 알면서
          수집하지 않습니다. 아동의 정보가 수집된 사실을 알게 되면 지체 없이 삭제합니다.
        </P>
        <Sub>
          {APP_NAME} is not directed to children under 14, and we do not knowingly collect their
          personal information. If we learn that we have, we delete it promptly.
        </Sub>
      </Section>

      <Section title="변경 고지 / Changes">
        <P>
          이 방침이 변경되면 이 페이지의 최종 개정일을 갱신하여 안내합니다. 중요한 변경은 앱 내에서
          별도로 알립니다.
        </P>
        <Sub>
          If this policy changes, we update the "last updated" date on this page. Significant
          changes will also be announced in the app.
        </Sub>
      </Section>
    </LegalPage>
  );
};

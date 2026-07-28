import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';

// ── 계정 삭제 확인 모달 ────────────────────────────────────────────────────
// 되돌릴 수 없는 동작이라 비밀번호 재입력을 요구한다 (서버에서도 재확인).
const DeleteAccountModal = ({ onClose }: { onClose: () => void }) => {
  const { deleteAccount } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError('');
    try {
      await deleteAccount(password);
      setDone(true);
      // 삭제 완료 화면을 잠깐 보여준 뒤 로그인 화면으로
      setTimeout(() => navigate('/login', { replace: true }), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.something_wrong'));
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={() => !loading && !done && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm p-6"
        style={{
          background: 'var(--color-butter-bg)',
          border: '1px solid var(--color-butter-rule)',
          borderRadius: '3px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {done ? (
          <div className="text-center py-4">
            <Check size={22} className="mx-auto mb-3" style={{ color: 'var(--color-butter-primary)' }} />
            <p className="font-serif italic" style={{ fontSize: '15px', color: 'var(--color-butter-text)' }}>
              {t('settings.delete.done')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleDelete}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} style={{ color: '#a13d2d' }} />
              <h2 className="font-serif" style={{ fontSize: '17px', color: 'var(--color-butter-text)' }}>
                {t('settings.delete.confirm.title')}
              </h2>
            </div>

            <p className="mb-4" style={{ fontSize: '13px', lineHeight: 1.65, color: 'var(--color-butter-muted)' }}>
              {t('settings.delete.confirm.desc')}
            </p>

            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('settings.delete.password')}
              disabled={loading}
              className="w-full px-3 py-2.5 mb-3 bg-transparent focus:outline-none text-butter-text placeholder:text-butter-muted/50"
              style={{
                border: '1px solid var(--color-butter-rule)',
                borderRadius: '2px',
                fontSize: '16px', // ⚠️ 16px 미만이면 iOS 가 입력 시 화면을 확대함
              }}
            />

            {error && (
              <p className="mb-3" style={{ fontSize: '12px', color: '#a13d2d' }}>
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 font-medium uppercase tracking-[0.1em] transition-opacity hover:opacity-70"
                style={{
                  fontSize: '11px',
                  border: '1px solid var(--color-butter-rule)',
                  borderRadius: '2px',
                  color: 'var(--color-butter-muted)',
                  background: 'transparent',
                }}
              >
                {t('settings.delete.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="flex-1 py-2.5 font-semibold uppercase tracking-[0.1em] text-white transition-opacity"
                style={{
                  fontSize: '11px',
                  borderRadius: '2px',
                  border: 'none',
                  background: '#a13d2d',
                  opacity: loading || !password ? 0.5 : 1,
                }}
              >
                {loading ? t('settings.delete.deleting') : t('settings.delete.confirm')}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

// ── 설정 페이지 ────────────────────────────────────────────────────────────
export const Settings = () => {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const DELETED_ITEMS = [
    'settings.delete.item.account',
    'settings.delete.item.journal',
    'settings.delete.item.emotions',
    'settings.delete.item.shelf',
    'settings.delete.item.profile',
  ] as const;

  return (
    <div className="pt-20 pb-24 px-6 md:px-12 max-w-2xl mx-auto">
      <p
        className="uppercase tracking-[0.18em] mb-3"
        style={{ fontSize: '10px', color: 'var(--color-butter-muted)', opacity: 0.7 }}
      >
        {t('settings.label')}
      </p>
      <h1 className="font-serif mb-10" style={{ fontSize: '2.4rem', lineHeight: 1.1 }}>
        {t('settings.title')}
      </h1>

      {/* ── 계정 정보 ── */}
      <section className="mb-12">
        <h2
          className="uppercase tracking-[0.14em] mb-4 pb-2"
          style={{
            fontSize: '10px',
            color: 'var(--color-butter-muted)',
            borderBottom: '1px solid var(--color-butter-rule)',
          }}
        >
          {t('settings.account')}
        </h2>

        <div className="flex items-center justify-between py-2">
          <span style={{ fontSize: '13px', color: 'var(--color-butter-muted)' }}>
            {t('settings.username')}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--color-butter-text)', fontWeight: 500 }}>
            {user?.username}
          </span>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login', { replace: true });
          }}
          className="mt-4 transition-opacity hover:opacity-70"
          style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-butter-muted)',
            background: 'none',
            border: '1px solid var(--color-butter-rule)',
            borderRadius: '2px',
            padding: '7px 14px',
            cursor: 'pointer',
          }}
        >
          {t('settings.signout')}
        </button>
      </section>

      {/* ── 위험 구역 ── */}
      <section>
        <h2
          className="uppercase tracking-[0.14em] mb-4 pb-2"
          style={{ fontSize: '10px', color: '#a13d2d', borderBottom: '1px solid rgba(161,61,45,0.25)' }}
        >
          {t('settings.danger')}
        </h2>

        <h3 className="font-serif mb-2" style={{ fontSize: '16px', color: 'var(--color-butter-text)' }}>
          {t('settings.delete.title')}
        </h3>
        <p className="mb-5" style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--color-butter-muted)' }}>
          {t('settings.delete.desc')}
        </p>

        <p
          className="uppercase tracking-[0.12em] mb-2"
          style={{ fontSize: '9px', color: 'var(--color-butter-muted)', opacity: 0.7 }}
        >
          {t('settings.delete.what')}
        </p>
        <ul className="mb-6 space-y-1">
          {DELETED_ITEMS.map((key) => (
            <li
              key={key}
              className="flex items-start gap-2"
              style={{ fontSize: '12.5px', color: 'var(--color-butter-muted)' }}
            >
              <span style={{ opacity: 0.5 }}>·</span>
              {t(key)}
            </li>
          ))}
        </ul>

        <button
          onClick={() => setModalOpen(true)}
          className="transition-opacity hover:opacity-85"
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#a13d2d',
            background: 'transparent',
            border: '1px solid #a13d2d',
            borderRadius: '2px',
            padding: '10px 18px',
            cursor: 'pointer',
          }}
        >
          {t('settings.delete.button')}
        </button>
      </section>

      <AnimatePresence>
        {modalOpen && <DeleteAccountModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

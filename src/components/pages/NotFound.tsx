import { useLocale } from '../../hooks/useLocale';
import { useNavigate } from 'react-router-dom';

export const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useLocale();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-butter-primary mb-4">
        404
      </p>
      <h1 className="text-5xl font-serif mb-4">{t('404.title')}</h1>
      <p className="text-butter-muted mb-10 max-w-sm">
        {t('404.desc')}
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-8 py-3 bg-butter-primary text-white rounded-full font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
      >
        {t('404.back')}
      </button>
    </div>
  );
};

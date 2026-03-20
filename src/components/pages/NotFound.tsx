import { useNavigate } from 'react-router-dom';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-butter-primary mb-4">
        404
      </p>
      <h1 className="text-5xl font-serif mb-4">Page not found</h1>
      <p className="text-butter-muted mb-10 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-8 py-3 bg-butter-primary text-white rounded-full font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
      >
        Back to Home
      </button>
    </div>
  );
};

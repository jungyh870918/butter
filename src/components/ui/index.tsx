import { useState } from 'react';

// ── LoadingSpinner ─────────────────────────────────────────────────────────

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-8 h-8 rounded-full border-2 border-butter-accent border-t-butter-primary animate-spin" />
  </div>
);

// ── ErrorMessage ───────────────────────────────────────────────────────────

export const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-butter-muted">
    <p className="text-sm uppercase tracking-widest font-bold mb-2">Something went wrong</p>
    <p className="text-xs opacity-60">{message}</p>
  </div>
);

// ── EmptyState ─────────────────────────────────────────────────────────────

export const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-24 text-butter-muted">
    <p className="text-sm uppercase tracking-widest font-bold">{message}</p>
  </div>
);

// ── BookCoverImage ─────────────────────────────────────────────────────────

interface BookCoverImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const BookCoverImage = ({ src, alt, className = '' }: BookCoverImageProps) => {
  const [failed, setFailed] = useState(false);

  // 이니셜 추출 (제목 첫 글자들)
  const initials = alt
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-butter-accent text-butter-primary font-serif font-bold select-none ${className}`}
        style={{ fontSize: 'clamp(1rem, 8%, 2.5rem)' }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
};

// ── AvatarImage ────────────────────────────────────────────────────────────

interface AvatarImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const AvatarImage = ({ src, alt, className = '' }: AvatarImageProps) => {
  const [failed, setFailed] = useState(false);

  const initial = alt?.[0]?.toUpperCase() ?? '?';

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-butter-primary text-white font-bold text-xs select-none ${className}`}
      >
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
};

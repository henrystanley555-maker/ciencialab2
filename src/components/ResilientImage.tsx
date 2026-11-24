import { useState } from 'react';
import { Atom } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({ src, alt, className = '', fallbackTitle }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-teal-50/60 text-slate-500 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Atom className="w-8 h-8 text-teal-700 mb-2" strokeWidth={1.5} />
        {fallbackTitle ? (
          <span className="text-xs font-medium text-slate-600 max-w-[20ch] line-clamp-2">{fallbackTitle}</span>
        ) : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

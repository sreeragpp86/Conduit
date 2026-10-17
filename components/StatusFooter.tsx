'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, BookOpen } from 'lucide-react';


const BACKEND_URL = 'http://localhost:8000';

export function StatusFooter() {
  const [isOperational, setIsOperational] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      const start = performance.now();
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { cache: 'no-store' });
        const roundtrip = Math.round(performance.now() - start);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsOperational(data.status === 'operational');
            setLatency(roundtrip);
          }
        } else {
          if (isMounted) setIsOperational(false);
        }
      } catch {
        if (isMounted) {
          setIsOperational(false);
          setLatency(null);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <footer className="fixed bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-4 py-1.5 rounded-full bg-[#121214]/90 border border-white/10 shadow-2xl shadow-black/80 backdrop-blur-xl text-[11px] font-mono text-white/50 select-none">
      {/* Backend Health Ping */}
      <div className="flex items-center gap-1.5 pr-3 border-r border-white/10">
        <span className="relative flex h-2 w-2">
          {isOperational === true && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isOperational === true
                ? 'bg-emerald-500'
                : isOperational === false
                ? 'bg-rose-500'
                : 'bg-amber-400'
            }`}
          />
        </span>
        <span className="text-white/70">
          {isOperational === true
            ? `Conduit Engine: Operational ${latency !== null ? `(${latency}ms)` : ''}`
            : isOperational === false
            ? 'Conduit Engine: Offline'
            : 'Connecting...'}
        </span>
      </div>

      {/* Docs Link */}
      <a
        href="http://localhost:8000/docs"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1 hover:text-white/90 transition-colors"
      >
        <BookOpen size={11} />
        <span>API Docs</span>
        <ExternalLink size={9} className="opacity-60" />
      </a>

      {/* GitHub Source Link */}
      <a
        href="https://github.com/sreeragpp86/Conduit"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 hover:text-white/90 transition-colors"
      >
        <svg
          className="w-3 h-3 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
        <span>GitHub Source</span>
        <ExternalLink size={9} className="opacity-60" />
      </a>


      <div className="w-px h-3 bg-white/10" />

      {/* Sign-off */}
      <span className="text-white/35 font-normal">
        Engineered by <span className="text-white/60 font-medium">Sreerag P P</span>
      </span>
    </footer>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, X, Shield, Sparkles, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'conduit_api_keys';

export function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const { apiKeys, setApiKeys } = useWorkflowStore();
  const [groqKey, setGroqKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [showGroq, setShowGroq] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync from localStorage or Zustand store on open
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setGroqKey(parsed.groq || '');
          setGeminiKey(parsed.gemini || '');
          setApiKeys(parsed);
        } else {
          setGroqKey(apiKeys.groq || '');
          setGeminiKey(apiKeys.gemini || '');
        }
      } catch {
        setGroqKey(apiKeys.groq || '');
        setGeminiKey(apiKeys.gemini || '');
      }
      setSavedSuccess(false);
    }
  }, [isOpen, apiKeys, setApiKeys]);

  if (!isOpen) return null;

  const handleSave = () => {
    const keys = {
      groq: groqKey.trim(),
      gemini: geminiKey.trim(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch {
      // ignore storage error
    }
    setApiKeys(keys);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleClear = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setGroqKey('');
    setGeminiKey('');
    setApiKeys({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#121214] border border-white/10 shadow-2xl shadow-black/80 p-6 space-y-5 text-white/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <Key size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">API Credentials</h3>
              <p className="text-[11px] font-mono text-white/40">Live LLM Provider Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Security Notice */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] font-mono text-white/50 leading-relaxed">
          <Shield size={14} className="text-emerald-400 shrink-0" />
          <span>Keys are stored in your local browser storage and dispatched securely to the local backend.</span>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          {/* Groq Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-white/60">
                Groq API Key
              </label>
              <span className="text-[10px] font-mono text-violet-400/80">Llama-3.3-70B</span>
            </div>
            <div className="relative">
              <input
                type={showGroq ? 'text' : 'password'}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono px-3 py-2 pr-9 text-white/90 placeholder-white/20 focus:outline-none focus:border-violet-500/60 focus:bg-white/[0.06] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowGroq(!showGroq)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
              >
                {showGroq ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Gemini Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-white/60">
                Google Gemini API Key
              </label>
              <span className="text-[10px] font-mono text-blue-400/80">Gemini-2.5-Flash</span>
            </div>
            <div className="relative">
              <input
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full rounded-lg bg-white/[0.04] border border-white/10 text-xs font-mono px-3 py-2 pr-9 text-white/90 placeholder-white/20 focus:outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
              >
                {showGemini ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Fallback Notice */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-300/80">
          <Sparkles size={13} className="shrink-0 mt-0.5" />
          <span>If no keys are provided, Conduit automatically falls back to deterministic synthesizer output so all DAG simulations succeed locally.</span>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={12} />
            Clear
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-500/25 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check size={13} /> Saved
                </>
              ) : (
                'Save Keys'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

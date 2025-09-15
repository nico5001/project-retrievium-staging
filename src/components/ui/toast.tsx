"use client";

import React from "react";
import { createPortal } from "react-dom";
import { RxCross2 } from "react-icons/rx";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

/* ========================
   Public API
   ======================== */
export type ToastType = "success" | "error" | "warning" | "info";

export type PushArgs =
  | { message: string; type?: ToastType; duration?: number }
  | string; // push("Saved!") => info, 5s

type ToastContextValue = {
  push: (args: PushArgs) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ========================
   Styles
   ======================== */
const typeStyles: Record<
  ToastType,
  {
    bg: string;
    ring: string;
    text: string;
    icon: React.ComponentType<{ className?: string }>;
    bar: string;
  }
> = {
  success: {
    bg: "from-emerald-900/30 to-emerald-800/20",
    ring: "ring-emerald-400/50",
    text: "text-emerald-200",
    icon: FaCheckCircle,
    bar: "bg-emerald-400",
  },
  error: {
    bg: "from-rose-900/30 to-rose-800/20",
    ring: "ring-rose-400/50",
    text: "text-rose-200",
    icon: FaExclamationCircle,
    bar: "bg-rose-400",
  },
  warning: {
    bg: "from-amber-900/30 to-amber-800/20",
    ring: "ring-amber-400/50",
    text: "text-amber-200",
    icon: FaExclamationTriangle,
    bar: "bg-amber-400",
  },
  info: {
    bg: "from-cyan-900/30 to-cyan-800/20",
    ring: "ring-cyan-400/50",
    text: "text-cyan-200",
    icon: FaInfoCircle,
    bar: "bg-cyan-400",
  },
};

/* ========================
   Toast Card
   ======================== */
function ToastCard({
  id,
  message,
  type,
  startedAt,
  duration,
  onClose,
  now,
}: {
  id: number;
  message: string;
  type: ToastType;
  startedAt: number;
  duration: number;
  now: number;
  onClose: (id: number) => void;
}) {
  const { bg, ring, text, icon: Icon, bar } = typeStyles[type];

  const elapsed = Math.max(0, now - startedAt);
  const pct = Math.max(0, 1 - elapsed / duration); // 1→0

  return (
    <div
      className={`group relative w-[320px] max-w-[92vw] overflow-hidden rounded-xl border border-slate-600/40
                  bg-gradient-to-br ${bg} ${text} shadow-2xl backdrop-blur-sm
                  ring-1 ${ring} animate-toast-in`}
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
    >
      {/* glow scan line */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-[1200ms]" />
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon className="mt-[2px] h-5 w-5 flex-shrink-0 drop-shadow" />
        <div className="flex-1 font-mono text-sm leading-relaxed">{message}</div>
        <button
          onClick={() => onClose(id)}
          className="ml-2 rounded p-1 text-slate-300/70 hover:text-white hover:bg-white/5 transition"
          aria-label="Close notification"
        >
          <RxCross2 className="h-4 w-4" />
        </button>
      </div>

      {/* progress bar */}
      <div className="h-1 w-full bg-slate-700/50">
        <div
          className={`h-1 ${bar} transition-[width] duration-100 ease-linear`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
    </div>
  );
}

/* ========================
   Provider (portal + queue)
   ======================== */
type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  startedAt: number;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const [portalEl, setPortalEl] = React.useState<HTMLElement | null>(null);
  const [now, setNow] = React.useState(() => Date.now());

  // keep re-rendering for progress bars
  React.useEffect(() => {
    setPortalEl(document.body);
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const remove = React.useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const push = React.useCallback(
    (args: PushArgs) => {
      const normalized =
        typeof args === "string"
          ? { message: args, type: "info" as ToastType, duration: 5000 }
          : {
              message: args.message,
              type: (args.type ?? "info") as ToastType,
              duration: Math.max(1200, args.duration ?? 5000),
            };

      const id = Math.floor(Date.now() + Math.random() * 1000);
      const item: ToastItem = {
        id,
        message: normalized.message,
        type: normalized.type,
        duration: normalized.duration,
        startedAt: Date.now(),
      };
      setToasts((ts) => [...ts, item]);

      // auto dismiss
      setTimeout(() => remove(id), normalized.duration);
    },
    [remove]
  );

  const value = React.useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {portalEl &&
        createPortal(
          <div
            className="
              fixed bottom-6 right-6 z-[1000] flex w-full max-w-full flex-col items-end gap-3
              md:right-6 md:items-end
              sm:bottom-6
            "
          >
            {toasts.map((t) => (
              <ToastCard
                key={t.id}
                id={t.id}
                message={t.message}
                type={t.type}
                duration={t.duration}
                startedAt={t.startedAt}
                now={now}
                onClose={remove}
              />
            ))}
          </div>,
          portalEl
        )}
    </ToastContext.Provider>
  );
};

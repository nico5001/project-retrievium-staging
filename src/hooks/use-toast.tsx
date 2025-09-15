import * as React from "react";

type ToastActionElement = React.ReactElement;

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  duration?: number;
};

type ToasterToast = ToastProps & {
  id: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type ToastState = { toasts: ToasterToast[] };

const TOAST_REMOVE_DELAY = 1000;

const addToasts = (s: ToastState, t: ToasterToast): ToastState => ({
  ...s,
  toasts: [t, ...s.toasts].slice(0, 100),
});
const updateToast = (s: ToastState, t: Partial<ToasterToast>): ToastState => ({
  ...s,
  toasts: s.toasts.map((x) => (x.id === t.id ? { ...x, ...t } : x)),
});
const dismissToast = (s: ToastState, id?: string): ToastState => ({
  ...s,
  toasts: s.toasts.map((x) => (id ? (x.id === id ? { ...x, open: false } : x) : { ...x, open: false })),
});
const removeToast = (s: ToastState, id?: string): ToastState => ({
  ...s,
  toasts: id ? s.toasts.filter((x) => x.id !== id) : [],
});

type Ctx = {
  toast: (props: ToastProps) => { id: string; dismiss: () => void; remove: () => void };
  toasts: ToasterToast[];
  dismiss: (id?: string) => void;
  remove: (id?: string) => void;
};

const ToastContext = React.createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ToastState>({ toasts: [] });
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const remove = React.useCallback((id?: string) => {
    setState((s) => removeToast(s, id));
    if (id) {
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      timers.current.delete(id);
    } else {
      // clear all
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    }
  }, []);

  const dismiss = React.useCallback((id?: string) => {
    setState((s) => dismissToast(s, id));
    const ids = id ? [id] : state.toasts.map((x) => x.id);
    ids.forEach((x) => {
      const timeout = setTimeout(() => remove(x), TOAST_REMOVE_DELAY);
      timers.current.set(x, timeout);
    });
  }, [remove, state.toasts]);

  const toast = React.useCallback((props: ToastProps) => {
    const id = props.id ?? randomId();
    const duration = props.duration ?? 4000;
    const onOpenChange = (open: boolean) => { if (!open) dismiss(id); };
    const t: ToasterToast = { id, open: true, onOpenChange, duration, ...props };
    setState((s) => addToasts(s, t));
    return { id, dismiss: () => dismiss(id), remove: () => remove(id) };
  }, [dismiss, remove]);

  const value = React.useMemo<Ctx>(() => ({
    toast, toasts: state.toasts, dismiss, remove
  }), [toast, state.toasts, dismiss, remove]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

function randomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    // @ts-ignore
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

import { create } from "zustand";

export type DialogSeverity = "info" | "danger" | "success";

interface ConfirmOptions {
  title?: string;
  message: string;
  severity?: DialogSeverity;
  confirmText?: string;
  cancelText?: string;
  resolve?: (value: boolean) => void;
}

interface PromptOptions {
  title?: string;
  message: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  resolve?: (value: string | null) => void;
}

interface AlertOptions {
  title?: string;
  message: string;
  severity?: DialogSeverity;
}

interface DialogState {
  confirmState: ConfirmOptions | null;
  alertState: AlertOptions | null;
  promptState: PromptOptions | null;

  confirm: (
    message: string,
    options?: Omit<ConfirmOptions, "message" | "resolve">,
  ) => Promise<boolean>;
  prompt: (
    message: string,
    options?: Omit<PromptOptions, "message" | "resolve">,
  ) => Promise<string | null>;
  alert: (message: string, options?: Omit<AlertOptions, "message">) => void;

  resolveConfirm: (value: boolean) => void;
  resolvePrompt: (value: string | null) => void;
  closeAlert: () => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  confirmState: null,
  alertState: null,
  promptState: null,

  confirm: (message, options) => {
    return new Promise((resolve) => {
      set({ confirmState: { message, ...options, resolve } });
    });
  },
  
  prompt: (message, options) => {
    return new Promise((resolve) => {
      set({ promptState: { message, ...options, resolve } });
    });
  },

  alert: (message, options) => {
    set({ alertState: { message, ...options } });

    // Auto-close alert after 4 seconds (act like a toast)
    setTimeout(() => {
      if (get().alertState?.message === message) {
        set({ alertState: null });
      }
    }, 4000);
  },

  resolveConfirm: (value) => {
    const state = get().confirmState;
    if (state?.resolve) {
      state.resolve(value);
    }
    set({ confirmState: null });
  },

  resolvePrompt: (value) => {
    const state = get().promptState;
    if (state?.resolve) {
      state.resolve(value);
    }
    set({ promptState: null });
  },

  closeAlert: () => set({ alertState: null }),
}));

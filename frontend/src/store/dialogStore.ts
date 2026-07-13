import { create } from 'zustand';

export type DialogSeverity = 'info' | 'danger' | 'success';

interface ConfirmOptions {
  title?: string;
  message: string;
  severity?: DialogSeverity;
  resolve?: (value: boolean) => void;
}

interface AlertOptions {
  title?: string;
  message: string;
  severity?: DialogSeverity;
}

interface DialogState {
  confirmState: ConfirmOptions | null;
  alertState: AlertOptions | null;
  
  confirm: (message: string, options?: Omit<ConfirmOptions, 'message' | 'resolve'>) => Promise<boolean>;
  alert: (message: string, options?: Omit<AlertOptions, 'message'>) => void;
  
  resolveConfirm: (value: boolean) => void;
  closeAlert: () => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  confirmState: null,
  alertState: null,

  confirm: (message, options) => {
    return new Promise((resolve) => {
      set({ confirmState: { message, ...options, resolve } });
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

  closeAlert: () => set({ alertState: null }),
}));

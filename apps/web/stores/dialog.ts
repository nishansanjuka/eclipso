import { create } from "zustand";

interface DialogState {
  openDialogs: Set<string>;
  setOpen: (key: string, open: boolean) => void;
  isOpen: (key: string) => boolean;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  openDialogs: new Set(),
  setOpen: (key, open) =>
    set((state) => {
      const newSet = new Set(state.openDialogs);
      if (open) {
        newSet.add(key);
      } else {
        newSet.delete(key);
      }
      return { openDialogs: newSet };
    }),
  isOpen: (key) => get().openDialogs.has(key),
}));

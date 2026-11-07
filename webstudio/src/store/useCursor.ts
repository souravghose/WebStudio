import { create } from 'zustand';

interface CursorState {
  line: number;
  column: number;
  selected: number;
  set: (line: number, column: number, selected: number) => void;
}

export const useCursor = create<CursorState>((set) => ({
  line: 1,
  column: 1,
  selected: 0,
  set: (line, column, selected) => set({ line, column, selected }),
}));

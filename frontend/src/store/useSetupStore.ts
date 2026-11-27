import { create } from "zustand";

interface SetupState {
  currentSemester: number;
  currentAcademicYear: string;
  setSemester: (s: number) => void;
  setAcademicYear: (y: string) => void;
}

export const useSetupStore = create<SetupState>((set) => ({
  currentSemester: 3,
  currentAcademicYear: "2025-26",
  setSemester: (s) => set({ currentSemester: s }),
  setAcademicYear: (y) => set({ currentAcademicYear: y }),
}));

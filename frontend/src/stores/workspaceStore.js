import { create } from 'zustand';

export const useWorkspaceStore = create((set) => ({
  currentWorkspace: null,
  currentProject: null,

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setCurrentProject: (project) => set({ currentProject: project }),
}));

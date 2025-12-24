// src/store/orderStore.ts
import { create } from 'zustand';
import type { MasterOrder, UploadedFile } from '../types';

interface OrderState {
  // 상태 (State)
  files: UploadedFile[];
  masterData: MasterOrder[];
  
  // 액션 (Actions)
  addFiles: (newFiles: UploadedFile[]) => void;
  setMasterData: (data: MasterOrder[]) => void;
  clearAll: () => void;
  removeFile: (fileId: string) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  files: [],
  masterData: [],

  addFiles: (newFiles) => set((state) => ({ 
    files: [...state.files, ...newFiles] 
  })),

  setMasterData: (data) => set({ masterData: data }),

  removeFile: (fileId) => set((state) => ({
    files: state.files.filter(f => f.id !== fileId),
    // 파일이 삭제되면 변환된 데이터도 다시 계산해야 할 수 있으므로 일단 초기화하거나 로직 추가 가능
  })),

  clearAll: () => set({ files: [], masterData: [] }),
}));
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MasterOrder, UploadedFile } from '../types';
import { 
  DEFAULT_HEADER_MAPPING, 
  DEFAULT_PRODUCT_NORMALIZATION_RULES 
} from '../lib/constants';

interface OrderState {
  // 상태
  files: UploadedFile[];
  masterData: MasterOrder[];
  headerMappings: Record<string, string[]>;
  productRules: Record<string, string>;

  // Actions
  addFiles: (newFiles: UploadedFile[]) => void;
  setMasterData: (data: MasterOrder[]) => void;
  removeFile: (fileId: string) => void;
  clearAll: () => void;

  // 설정 변경 Actions
  addHeaderKeyword: (key: string, keyword: string) => void;
  removeHeaderKeyword: (key: string, keyword: string) => void;
  addProductRule: (keyword: string, standardName: string) => void;
  removeProductRule: (keyword: string) => void;
  resetSettings: () => void; // 초기화
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      files: [],
      masterData: [],
      
      // 초기값은 constants.ts에서 가져옴
      headerMappings: DEFAULT_HEADER_MAPPING,
      productRules: DEFAULT_PRODUCT_NORMALIZATION_RULES,

      addFiles: (newFiles) => set((state) => ({ files: [...state.files, ...newFiles] })),
      setMasterData: (data) => set({ masterData: data }),
      removeFile: (fileId) => set((state) => ({ files: state.files.filter((f) => f.id !== fileId) })),
      clearAll: () => set({ files: [], masterData: [] }),

      // 설정 관리 로직 구현
      addHeaderKeyword: (key, keyword) => set((state) => ({
        headerMappings: {
          ...state.headerMappings,
          [key]: [...state.headerMappings[key], keyword]
        }
      })),
      
      removeHeaderKeyword: (key, keyword) => set((state) => ({
        headerMappings: {
          ...state.headerMappings,
          [key]: state.headerMappings[key].filter(k => k !== keyword)
        }
      })),

      addProductRule: (keyword, standardName) => set((state) => ({
        productRules: {
          ...state.productRules,
          [keyword]: standardName
        }
      })),

      removeProductRule: (keyword) => set((state) => {
        const newRules = { ...state.productRules };
        delete newRules[keyword];
        return { productRules: newRules };
      }),

      resetSettings: () => set({
        headerMappings: DEFAULT_HEADER_MAPPING,
        productRules: DEFAULT_PRODUCT_NORMALIZATION_RULES
      })
    }),
    {
      name: 'sweep-order-settings', 
      storage: createJSONStorage(() => localStorage), 
      // 설정만 저장
      partialize: (state) => ({ headerMappings: state.headerMappings, productRules: state.productRules }), 
    }
  )
);
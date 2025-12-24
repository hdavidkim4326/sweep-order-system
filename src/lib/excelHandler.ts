import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid'; 
import type { MasterOrder, UploadedFile } from '../types';


/**
 * Excel Date Serial -> JS Date 변환 유틸
 */
const excelDateToJSDate = (serial: number) => {
   return new Date(Math.round((serial - 25569) * 86400 * 1000));
};

/**
 * 헤더 매핑: 입력된 헤더와 매핑 규칙 간의 일치 여부 확인
 * 1단계: 공백 제거 후 정확히 일치(Exact Match) 먼저 확인
 * 2단계: 포함 여부(Fuzzy Match)로 판단
 */
const findMappedKey = (header: string, mappingRules: Record<string, string[]>): string | null => {
  const normalizedHeader = header.replace(/\s+/g, '').trim(); // 엑셀 헤더 공백 제거거

  // 1단계: 정확히 일치하는 경우 (Priority 1: Exact Match)
  for (const [key, candidates] of Object.entries(mappingRules)) {
    const isExactMatch = candidates.some(candidate => {
      return normalizedHeader === candidate.replace(/\s+/g, '').trim();
    });
    if (isExactMatch) return key;
  }

  // 2단계: 포함되는지 확인 (정확히 일치하는 게 없을 때만 수행)
  for (const [key, candidates] of Object.entries(mappingRules)) {
    const isFuzzyMatch = candidates.some(candidate => {
       const normalizedCandidate = candidate.replace(/\s+/g, '').trim();
       return normalizedHeader.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedHeader);
    });
    if (isFuzzyMatch) return key;
  }

  return null;
};

/**
 * 상품명 정규화 (Normalization)
 * 규칙을 인자로 받음
 */
const normalizeProductName = (rawName: string, rules: Record<string, string>): string => {
  if (!rawName) return '';
  for (const [keyword, standardName] of Object.entries(rules)) {
    if (rawName.includes(keyword)) {
      return standardName;
    }
  }
  return rawName;
};

/**
 * 엑셀 파일 로드 및 JSON 파싱 (비동기 처리)
 */
export const processExcelFile = async (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 첫 번째 시트 데이터 추출
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Header가 포함된 Raw Data 추출
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        resolve({
          id: uuidv4(), // 고유 ID 부여
          name: file.name,
          rows: rawData,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

/**
 * Raw Data -> MasterOrder 표준 포맷 변환
 * 1. 컬럼 매핑 (Header Mapping)
 * 2. 데이터 전처리 (Trimming)
 * 3. 상품명 정규화 수행
 */
export const convertToMasterData = (
  files: UploadedFile[], 
  mappingRules: Record<string, string[]>, 
  productRules: Record<string, string>    
): MasterOrder[] => {
  
  const masterList: MasterOrder[] = [];

  files.forEach((file) => {
    file.rows.forEach((row: any) => {
      if (Object.keys(row).length === 0) return;

      const newOrder: any = { id: uuidv4(), courier: '한진택배' };

      Object.keys(row).forEach((colKey) => {
        // 인자로 받은 헤더 매핑 규칙을 사용
        const mappedKey = findMappedKey(colKey, mappingRules);
        
        if (mappedKey) {
          let value = row[colKey];
          
          if (mappedKey === 'contact' || mappedKey === 'postCode') {
            value = String(value).trim();
          }
          
          if (mappedKey === 'productName') {
            // 인자로 받은 상품명 정규화 규칙 사용
            value = normalizeProductName(String(value), productRules);
          }

          const existingValue = newOrder[mappedKey];
          if (!existingValue) {
             newOrder[mappedKey] = value;
          } else if (value && String(value).trim() !== '') {
             newOrder[mappedKey] = value;
          }
        }
      });

      if (newOrder.receiver && newOrder.productName) {
        if (!newOrder.quantity) newOrder.quantity = 1;
        masterList.push(newOrder as MasterOrder);
      }
    });
  });

  return masterList;
};
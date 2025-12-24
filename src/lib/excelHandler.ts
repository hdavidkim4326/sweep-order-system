// src/lib/excelHandler.ts
import * as XLSX from 'xlsx';
import { MasterOrder, UploadedFile } from '../types';
import { HEADER_MAPPING, PRODUCT_NORMALIZATION_RULES } from './constants';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid needed later, or use simple random string

// 1. 엑셀 날짜 시리얼 번호를 JS Date로 변환 (필요시 사용)
const excelDateToJSDate = (serial: number) => {
   return new Date(Math.round((serial - 25569) * 86400 * 1000));
};

// 2. 가장 유사한 헤더 찾기 (Fuzzy Matching)
// 예: "수령인명" -> "receiver" 매핑 찾기
const findMappedKey = (header: string): string | null => {
  const normalizedHeader = header.replace(/\s+/g, '').trim(); // 공백 제거
  
  for (const [key, candidates] of Object.entries(HEADER_MAPPING)) {
    if (candidates.some(c => normalizedHeader.includes(c) || c.includes(normalizedHeader))) {
      return key;
    }
  }
  return null;
};

// 3. 상품명 정규화 (핵심 로직 ⭐)
const normalizeProductName = (rawName: string): string => {
  if (!rawName) return '';
  
  // 규칙에 정의된 키워드가 포함되어 있는지 확인
  for (const [keyword, standardName] of Object.entries(PRODUCT_NORMALIZATION_RULES)) {
    if (rawName.includes(keyword)) {
      return standardName;
    }
  }
  
  // 규칙에 없으면 원본 반환 (혹은 '기타' 처리)
  return rawName;
};

// 4. 파일 읽기 및 데이터 변환 (Main Function)
export const processExcelFile = async (file: File): Promise<UploadedFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 첫 번째 시트만 사용한다고 가정
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // JSON으로 변환 (헤더 포함)
        const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        resolve({
          id: Math.random().toString(36).substr(2, 9),
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

// 5. 로우 데이터 -> 통합 데이터(MasterOrder) 변환
export const convertToMasterData = (files: UploadedFile[]): MasterOrder[] => {
  const masterList: MasterOrder[] = [];

  files.forEach((file) => {
    file.rows.forEach((row: any) => {
      // 빈 행 건너뛰기
      if (Object.keys(row).length === 0) return;

      const newOrder: any = {
        id: Math.random().toString(36).substr(2, 9), // 고유 ID 생성
        courier: '한진택배', // 기본값
      };

      // 각 컬럼 매핑 처리
      Object.keys(row).forEach((colKey) => {
        const mappedKey = findMappedKey(colKey);
        if (mappedKey) {
          let value = row[colKey];
          
          // 데이터 전처리 (전화번호 하이픈 등)
          if (mappedKey === 'contact' || mappedKey === 'postCode') {
            value = String(value).trim();
          }
          
          // 상품명 정규화 적용
          if (mappedKey === 'productName') {
            value = normalizeProductName(String(value));
          }

          newOrder[mappedKey] = value;
        }
      });

      // 필수 데이터(수령인, 상품명)가 있는 경우에만 추가
      if (newOrder.receiver && newOrder.productName) {
        // 수량이 없으면 1로 기본 설정
        if (!newOrder.quantity) newOrder.quantity = 1;
        masterList.push(newOrder as MasterOrder);
      }
    });
  });

  return masterList;
};
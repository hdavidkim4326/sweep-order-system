// src/lib/excelHandler.ts
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid 했다고 가정 (없으면 Math.random 대체 가능)
import { MasterOrder, UploadedFile } from '../types';
import { HEADER_MAPPING, PRODUCT_NORMALIZATION_RULES } from './constants';

/**
 * Excel Date Serial -> JS Date 변환 유틸
 */
const excelDateToJSDate = (serial: number) => {
   return new Date(Math.round((serial - 25569) * 86400 * 1000));
};

/**
 * Fuzzy Matching: 입력된 헤더와 매핑된 키워드 간의 일치 여부 확인
 * 공백 제거 후 포함 여부(includes)로 판단
 */
const findMappedKey = (header: string): string | null => {
  const normalizedHeader = header.replace(/\s+/g, '').trim();
  
  for (const [key, candidates] of Object.entries(HEADER_MAPPING)) {
    if (candidates.some(c => normalizedHeader.includes(c) || c.includes(normalizedHeader))) {
      return key;
    }
  }
  return null;
};

/**
 * 상품명 정규화 (Normalization)
 * 정의된 키워드 매칭을 통해 표준 상품명으로 변환
 */
const normalizeProductName = (rawName: string): string => {
  if (!rawName) return '';
  
  for (const [keyword, standardName] of Object.entries(PRODUCT_NORMALIZATION_RULES)) {
    if (rawName.includes(keyword)) {
      return standardName;
    }
  }
  return rawName; // 매칭되는 규칙이 없을 경우 원본 유지
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
export const convertToMasterData = (files: UploadedFile[]): MasterOrder[] => {
  const masterList: MasterOrder[] = [];

  files.forEach((file) => {
    file.rows.forEach((row: any) => {
      if (Object.keys(row).length === 0) return; // 빈 행 제외

      const newOrder: any = {
        id: uuidv4(),
        courier: '한진택배', // Default Value
      };

      Object.keys(row).forEach((colKey) => {
        const mappedKey = findMappedKey(colKey);
        
        if (mappedKey) {
          let value = row[colKey];
          
          // 데이터 클렌징 (연락처, 우편번호 공백 제거)
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

      // 필수 필드(수령인, 상품명) 검증 후 리스트 추가
      if (newOrder.receiver && newOrder.productName) {
        if (!newOrder.quantity) newOrder.quantity = 1; // 수량 누락 시 기본값 1
        masterList.push(newOrder as MasterOrder);
      }
    });
  });

  return masterList;
};
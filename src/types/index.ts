// src/types/index.ts

// 1. 최종적으로 변환되어야 할 표준 양식 (Output.xlsx 기준)
export interface MasterOrder {
    id: string;             // 렌더링용 고유 ID (UUID 등)
    receiver: string;       // 수령인
    contact: string;        // 수령인 연락처
    postCode: string;       // 우편번호
    address: string;        // 주소
    message: string;        // 배송메시지
    productName: string;    // 정규화된 상품명 (예: 반숙란 30구)
    quantity: number;       // 수량
    courier: string;        // 택배사 (기본값: 한진택배)
    trackingNumber?: string;// 운송장번호 (옵션)
  }
  
  // 2. 엑셀 파일 하나가 업로드되었을 때의 구조
  export interface UploadedFile {
    id: string;
    name: string;      // 파일명 (예: 23.10.18 진케어.xlsx)
    rows: any[];       // 엑셀의 Row 데이터들
    isError?: boolean; // 파싱 에러 여부
  }
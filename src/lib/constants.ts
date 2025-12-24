// src/lib/constants.ts

// 1. 결과물 엑셀의 헤더 순서
export const MASTER_HEADERS = [
    "수령인", "수령인 연락처", "우편번호", "주소", "배송메시지",
    "옵션", "수량", "택배사", "운송장번호"
  ];
  
  // 2. 지능형 헤더 매핑 (Column Alias)
  // 거래처마다 다른 헤더 이름을 표준 필드명으로 연결해줍니다.
  export const HEADER_MAPPING: Record<string, string[]> = {
    receiver: ['수취인', '수취인명', '수령인', '수령인명', '받는분', '이름', '주문자명'],
    contact: ['전화번호', '휴대폰', '휴대전화', '연락처', '수령인전화', '수령인핸드폰', '주문자연락처'],
    postCode: ['우편번호', '수령인 우편번호'],
    address: ['주소', '수령인 주소', '배송지'],
    message: ['배송메시지', '배송메세지', '주문메시지', '배송요청사항', '비고'],
    productName: ['상품명', '품명', '주문상품', '상품옵션', '옵션'],
    quantity: ['수량', '주문수량', '개수'],
  };
  
  // 3. 상품명 정규화 규칙 (Normalization Rules)
  // 왼쪽의 키워드가 포함되어 있다면 -> 오른쪽의 표준 상품명으로 변환
  export const PRODUCT_NORMALIZATION_RULES: Record<string, string> = {
    '반숙': '반숙란 30구',
    '구운': '구운란 30구',
    '훈제': '훈제란 30구',
    '동물복지': '동물복지 유정란 20구', // 예시 데이터 기반 추론
  };
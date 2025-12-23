# 🥚 스윕농장 발주 통합 시스템 (Sweep Order System)

여러 판매처(거래처)의 다양한 엑셀 주문서를 스윕농장의 **통합 표준 양식**으로 자동 변환해주는 웹 서비스입니다.

## 🛠 Tech Stack
- **Core:** React, TypeScript, Vite
- **State Management:** Zustand (가벼운 전역 상태 관리)
- **Data Processing:** SheetJS (xlsx)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React

## 📂 Project Structure
핵심 비즈니스 로직과 UI를 분리하여 유지보수성을 높였습니다.


src/ ├── lib/ # 엑셀 파싱 및 표준화 로직 (Core) ├── store/ # 전역 상태 관리 (Zustand) ├── components/ # 재사용 가능한 UI 컴포넌트 └── types/ # 데이터 타입 정의 (TypeScript)

## 🚀 How to Run (실행 방법)

### 1. 프로젝트 클론 및 이동
```bash
git clone [레포지토리 주소]
cd sweep-order-system
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 개발 서버 실행
```bash
npm run dev
```


---
## ✨ Key Features
1. **유연한 엑셀 업로드:** Drag & Drop 지원, 다중 파일 처리
2. **지능형 데이터 매핑:** 거래처별 상이한 컬럼명 자동 인식 및 매핑
3. **상품명 정규화:** 다양한 상품명을 표준 상품명으로 자동 변환
4. **미리보기 & 다운로드:** 변환 결과 즉시 확인 및 엑셀 다운로드
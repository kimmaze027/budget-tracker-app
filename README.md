# 가계부 앱 (Budget Tracker)

React Native 기반의 모바일 가계부 애플리케이션입니다.

## 주요 기능

- ✅ 수입/지출 거래 기록 및 관리
- ✅ 카테고리별 분류 (급여, 식비, 교통비 등)
- ✅ 월별 수입/지출 통계
- ✅ 카테고리별 통계 분석
- ✅ CSV 파일 내보내기/불러오기
- ✅ 로컬 저장소 (AsyncStorage) 기반
- ✅ 라이트/다크 모드 지원

## 기술 스택

- **프레임워크**: React Native (Expo SDK 54)
- **라우팅**: Expo Router 6
- **스타일링**: NativeWind 4 (Tailwind CSS)
- **언어**: TypeScript 5.9
- **상태 관리**: React 19
- **로컬 저장소**: AsyncStorage
- **백엔드** (옵션): tRPC + MySQL/TiDB

## 시작하기

### 필수 요구사항

- Node.js 18 이상
- pnpm 9.12.0
- Expo Go 앱 (모바일 테스트용)

### 설치

```bash
# 의존성 설치
pnpm install

# 개발 서버 시작
pnpm dev

# iOS에서 실행
pnpm ios

# Android에서 실행
pnpm android
```

### Expo Go로 테스트

1. 스마트폰에 Expo Go 앱 설치
2. `pnpm dev` 실행 후 표시되는 QR 코드 스캔
3. 앱이 자동으로 로드됩니다

## 프로젝트 구조

```
app/
  (tabs)/
    index.tsx        # 홈 화면
    statistics.tsx   # 통계 화면
    settings.tsx     # 설정 화면
  transaction/
    add.tsx          # 거래 추가 화면
lib/
  storage.ts         # AsyncStorage 유틸리티
  csv.ts             # CSV 내보내기/불러오기
components/
  screen-container.tsx  # 화면 컨테이너
  ui/                   # UI 컴포넌트
```

## 데이터 관리

### 로컬 저장소
모든 데이터는 기기의 AsyncStorage에 저장됩니다.

### CSV 백업
설정 화면에서 CSV 파일로 데이터를 내보내거나 불러올 수 있습니다.

## 라이선스

MIT License

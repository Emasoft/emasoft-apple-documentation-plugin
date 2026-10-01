# Emasoft Apple Documentation 플러그인

<!--BADGES-START-->
[![버전](https://img.shields.io/badge/version-2.0.0-blue)](https://github.com/Emasoft/emasoft-apple-documentation-plugin/releases)
[![라이선스: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
<!--BADGES-END-->

Claude Code용 Apple 개발자 문서: iOS, macOS, watchOS, tvOS, visionOS 문서, 프레임워크, API, SwiftUI, UIKit 및 WWDC 비디오를 검색하고, Swift/Objective-C 코드 예제, API 레퍼런스 및 기술 가이드를 Claude Code 세션에서 바로 확인할 수 있습니다. 플러그인에 MCP(모델 컨텍스트 프로토콜) 서버가 포함되어 있으므로 플러그인만 설치하면 됩니다.

이 플러그인(`emasoft-apple-documentation-plugin`)은 kimsungwhee의 [kimsungwhee/apple-docs-mcp](https://github.com/kimsungwhee/apple-docs-mcp)(MIT 라이선스)를 기반으로 합니다. 독립된 포크이며 Claude Code 플러그인으로 다시 패키징되었습니다. npm에는 게시되지 않습니다.

[English](README.md) | [日本語](README.ja.md) | **한국어** | [简体中文](README.zh-CN.md)

> **참고**: 이 한국어 버전은 영어 버전보다 늦게 업데이트될 수 있습니다. 설치, 설정, 개발 섹션은 영어 README를 기계 번역한 것입니다. 최신의 정확한 정보는 [영어 README](README.md)를 참조하세요.

## 기능

- **스마트 검색**: SwiftUI, UIKit, Foundation, CoreData, ARKit 등 Apple 개발자 문서 지능형 검색
- **완전한 문서 액세스**: Swift, Objective-C 및 프레임워크 문서를 위한 Apple JSON API 완전 액세스
- **Apple Design 및 HIG 액세스**: Human Interface Guidelines JSON, Apple Design 페이지 및 Design Resources 카탈로그 항목 읽기
- **디자인 리소스 미리보기**: Apple 제공 HIG 이미지와 리소스 썸네일을 MCP 이미지 콘텐츠 블록으로 반환
- **다운로드 가능한 디자인 리소스**: Apple에서 직접 호스팅하는 템플릿, 폰트, 도구, 아카이브를 로컬 MCP 리소스 캐시에 다운로드
- **프레임워크 인덱스**: iOS, macOS, watchOS, tvOS, visionOS 프레임워크의 계층적 API 구조 탐색
- **기술 카탈로그**: SwiftUI, UIKit, Metal, Core ML, Vision, ARKit을 포함한 Apple 기술 탐색
- **문서 업데이트**: WWDC 2025/2026 발표, iOS 27, macOS 27 및 최신 SDK 릴리스 추적
- **기술 개요**: Swift, SwiftUI, UIKit 및 모든 Apple 개발 플랫폼의 포괄적인 가이드
- **샘플 코드 라이브러리**: iOS, macOS 및 크로스 플랫폼 개발을 위한 Swift 및 Objective-C 코드 예제
- **WWDC 비디오 라이브러리**: WWDC 2014-2026 세션 검색, 트랜스크립트, Swift/SwiftUI 코드 예제 및 리소스 포함, 완전한 오프라인 지원
- **관련 API 발견**: SwiftUI 뷰, UIKit 컨트롤러 및 프레임워크별 API 관계 찾기
- **플랫폼 호환성**: iOS 13+, macOS 10.15+, watchOS 6+, tvOS 13+, visionOS 호환성 분석
- **고성능**: Xcode, Swift Playgrounds 및 AI 기반 개발 환경에 최적화
- **스마트 UserAgent 풀**: 자동 장애 복구 및 성능 모니터링을 갖춘 지능형 UserAgent 로테이션 시스템
- **멀티플랫폼**: 완전한 iOS, iPadOS, macOS, watchOS, tvOS, visionOS 문서 지원
- **베타 및 상태 추적**: 베타 및 신규 출시 API, 사용 중단된 UIKit 메서드, 새로운 SwiftUI 기능 추적

## 설치

### 요구 사항

- [Claude Code](https://code.claude.com/docs/en/overview)
- `PATH`에 있는 `node`(Node.js 22 이상). Claude Code는 포함된 서버를 `node`로 실행하며, 네이티브 설치 프로그램은 Node.js를 포함하지 않습니다. `node --version`으로 확인하세요.
- 설치된 플러그인 버전당 약 39 MB의 디스크 공간(WWDC 데이터가 오프라인 사용을 위해 포함되어 있습니다).

### Claude Code 세션에서

```text
/plugin marketplace add Emasoft/emasoft-plugins
/plugin install emasoft-apple-documentation-plugin@emasoft-plugins
```

### 터미널에서

```bash
claude plugin marketplace add Emasoft/emasoft-plugins
claude plugin install emasoft-apple-documentation-plugin@emasoft-plugins --scope user
```

Claude Code를 재시작하거나 `/reload-plugins`를 실행하여 플러그인을 활성화한 다음, `/mcp`로 이 플러그인의 `apple-docs` 서버가 연결되었는지 확인하세요.

### 업데이트 및 제거

```bash
claude plugin update emasoft-apple-documentation-plugin@emasoft-plugins
claude plugin uninstall emasoft-apple-documentation-plugin
```

### Claude Code의 도구 이름

Claude Code는 플러그인 MCP 서버의 도구에 네임스페이스를 붙이므로, 도구 `search_apple_docs`는 `mcp__plugin_emasoft-apple-documentation-plugin_apple-docs__search_apple_docs`로 표시됩니다. 이 이름을 직접 입력할 필요는 없습니다. 필요한 내용을 설명하면 Claude가 알맞은 도구를 선택합니다.

### 문제 해결

- **서버가 시작되지 않거나 `/mcp`에 실패로 표시되나요?** Claude Code는 `node` 명령으로 서버를 실행합니다. GUI 앱은 셸의 `PATH`를 상속하지 않을 수 있습니다. 터미널에서 `which node`를 실행하고, 해당 디렉터리가 Claude Code를 시작하는 프로세스의 `PATH`에 포함되어 있는지 확인하세요. 플러그인에는 Node.js 22 이상이 필요합니다.
- **`search_apple_docs`가 아무것도 반환하지 않거나 오류가 나나요?** developer.apple.com의 검색 페이지가 내부적으로 사용하는 비공개 Apple 검색 백엔드(`devintserv.msc.sbz.apple.com`)에 의존합니다. Apple이 응답 형식을 변경하면 이 플러그인이 따라잡을 때까지 `search_apple_docs`가 동작하지 않을 수 있습니다. `get_apple_doc_content`, `search_framework_symbols` 및 WWDC 도구는 이 엔드포인트에 의존하지 않으므로 계속 동작합니다.

## 사용 예제

자연어로 Claude에게 요청하면 알맞은 도구가 선택됩니다. 예:

### 스마트 검색

```text
"SwiftUI 애니메이션 검색"
"CoreML 모델 로딩 방법 찾기"
"Swift async/await 패턴 찾아보기"
"AlarmKit 스케줄링 예제 보여줘"
```

### 프레임워크 심화 탐구

```text
"SwiftUI 프레임워크의 상세 정보 가져오기"
"iOS 18 프레임워크의 새로운 기능은?"
"Vision 프레임워크 기능에 대해 알려줘"
"모든 WeatherKit API 보여줘"
```

### Apple Design 및 HIG

```text
"레이아웃에 대한 Apple Design 문서 검색"
"iOS 템플릿용 Apple Design Resources 나열"
"이 resourceId로 Apple Design 리소스 다운로드"
"레이아웃 HIG 페이지의 Apple Design 예제 보여줘"
```

### API 탐색

```text
"UIViewController 라이프사이클 메서드 보여줘"
"SwiftData 모델 생성 세부사항 가져오기"
"AlarmAttributes 속성은 무엇인가?"
"모든 ARKit 앵커 타입 나열"
```

### 샘플 코드 및 튜토리얼

```text
"알람 스케줄링 샘플 코드 찾기"
"SwiftUI 튜토리얼 예제 보여줘"
"카메라 캡처 샘플 코드 가져오기"
"Core Data 마이그레이션 예제 찾기"
```

### 기술 발견

```text
"iOS 최신 버전의 모든 베타 프레임워크 나열"
"그래픽 & 게임 기술 보여줘"
"어떤 머신러닝 프레임워크가 사용 가능한가?"
"모든 watchOS 프레임워크 탐색"
```

### 문서 업데이트

```text
"최신 WWDC 업데이트 보여줘"
"SwiftUI의 새로운 기능은?"
"iOS 기술 업데이트 가져오기"
"Xcode 릴리스 노트 보여줘"
"최신 업데이트에서 베타 기능 찾기"
```

### 기술 개요

```text
"앱 디자인과 UI의 기술 개요 보여줘"
"게임 개발을 위한 포괄적인 가이드 가져오기"
"AI 및 머신러닝 개요 탐색"
"iOS 전용 기술 가이드 보여줘"
"데이터 관리 기술 개요 가져오기"
```

### 샘플 코드 라이브러리

```text
"SwiftUI 샘플 코드 프로젝트 보여줘"
"머신러닝 샘플 코드 찾기"
"UIKit 예제 프로젝트 가져오기"
"추천 WWDC 샘플 코드 보여줘"
"Core Data 샘플 구현 찾기"
"베타 샘플 코드 프로젝트만 보여줘"
```

### WWDC 비디오 검색

```text
"SwiftUI에 대한 WWDC 비디오 검색"
"머신러닝 WWDC 세션 찾기"
"WWDC 2026 비디오 보여줘"
"async/await WWDC 강연 검색"
"Swift 동시성에 대한 WWDC 비디오 찾기"
"접근성 주제의 WWDC 세션 보여줘"
```

### WWDC 비디오 상세 정보

```text
"WWDC 세션 10176의 상세 정보 가져와"
"WWDC23 SwiftData 세션의 대본 보여줘"
"WWDC 비디오 10019의 코드 예제 가져오기"
"Vision Pro WWDC 세션의 리소스 보여줘"
"Meet async/await in Swift 세션의 대본 가져와"
```

### WWDC 주제 및 연도

```text
"모든 WWDC 주제 나열"
"Swift 주제의 WWDC 비디오 보여줘"
"개발자 도구에 대한 WWDC 비디오 가져오기"
"2023년 WWDC 비디오 나열"
"모든 SwiftUI 및 UI 프레임워크 세션 보여줘"
"머신러닝 WWDC 콘텐츠 가져오기"
```

## 사용 가능한 도구

| 도구 | 설명 | 주요 기능 |
|------|------|----------|
| `search_apple_docs` | Apple 개발자 문서 검색 | 공식 검색 API, 특정 API/클래스/메서드 검색 |
| `get_apple_doc_content` | 상세한 문서 내용 가져오기 | JSON API 액세스, 선택적 향상 분석 (관련/유사 API, 플랫폼 호환성) |
| `search_apple_design_docs` | Apple Design 및 HIG 콘텐츠 검색 | HIG JSON 참조, Design 페이지, Design Resources 카탈로그 |
| `get_apple_design_content` | Apple Design 및 HIG 페이지 읽기 | HIG JSON 렌더링, `/design/` 페이지용 HTML 폴백 |
| `list_apple_design_resources` | Apple Design Resources 나열 | 안정적인 리소스 ID, 카테고리/플랫폼/포맷 필터, 미리보기 및 링크 |
| `download_apple_design_resource` | Apple Design 리소스 직접 다운로드 | 로컬 캐시, MCP `resource_link` 블록, `resources/read` 블롭 액세스 |
| `get_apple_design_examples` | Apple Design 시각 예제 반환 | base64 데이터와 MIME 타입을 포함한 MCP `image` 블록 |
| `list_technologies` | 모든 Apple 기술 탐색 | 카테고리 필터링, 언어 지원, 베타 상태 |
| `search_framework_symbols` | 특정 프레임워크 내 심볼 검색 | 클래스, 구조체, 프로토콜, 와일드카드 패턴, 타입 필터링 |
| `get_related_apis` | 관련 API 찾기 | 상속, 준수, "참고" 관계 |
| `resolve_references_batch` | API 참조 일괄 해결 | 문서에서 모든 참조 추출 및 해결 |
| `get_platform_compatibility` | 플랫폼 호환성 분석 | 버전 지원, 베타 상태, 사용 중단 정보 |
| `find_similar_apis` | 유사한 API 발견 | Apple 공식 권장사항, 주제 그룹화 |
| `get_documentation_updates` | Apple 문서 업데이트 추적 | WWDC 발표, 기술 업데이트, 릴리스 노트 |
| `get_technology_overviews` | 기술 개요 및 가이드 가져오기 | 포괄적인 가이드, 계층적 탐색, 플랫폼 필터링 |
| `get_sample_code` | Apple 샘플 코드 프로젝트 탐색 | 프레임워크 필터링 (제한 있음), 키워드 검색, 베타 상태 |
| `list_wwdc_videos` | WWDC 비디오 세션 탐색 | 오프라인 대본과 코드, 주제/연도 필터링 |
| `search_wwdc_content` | WWDC 대본과 코드 전문 검색 | 특정 논의, API 언급, 구현 예제 |
| `get_wwdc_video` | WWDC 세션 전체 가져오기 | 전체 대본, 코드 예제, 리소스 |
| `get_wwdc_code_examples` | WWDC 세션의 코드 예제 탐색 | 세션 맥락이 포함된 구현 패턴 |
| `browse_wwdc_topics` | WWDC 주제 카테고리를 ID와 함께 나열 | `list_wwdc_videos` 필터에 쓰는 주제 ID |
| `find_related_wwdc_videos` | 비디오와 관련된 세션 찾기 | 선수 세션, 후속 세션, 유사한 강연 |
| `list_wwdc_years` | 사용 가능한 모든 WWDC 연도 나열 | 비디오 개수 및 통계와 함께 연도 정보 |

## 기술 아키텍처

```text
emasoft-apple-documentation-plugin/
├── .claude-plugin/plugin.json        # Claude Code 플러그인 매니페스트
├── .mcp.json                         # 포함된 MCP 서버(apple-docs) 등록
├── servers/apple-docs/
│   ├── index.js                      # 커밋된 esbuild 번들, 사용자가 실행하는 서버
│   └── THIRD_PARTY_LICENSES.txt      # 번들된 의존성의 라이선스
├── data/wwdc/                        # 오프라인 WWDC 데이터 (번들이 읽음)
├── src/                              # 서버의 TypeScript 소스
│   ├── index.ts                      # MCP 서버 진입점, 모든 도구 포함
│   ├── tools/                        # MCP 도구 구현 (docs, design, WWDC 등)
│   └── utils/                        # 캐시, HTTP 클라이언트, UserAgent 풀, 오류 처리
├── scripts/                          # build-bundle.mjs 및 publish.py
├── tests/                            # Jest 테스트 스위트
└── package.json                      # 개발 의존성 및 스크립트 (private)
```

### 성능 기능

- **메모리 기반 캐싱**: 자동 정리 및 TTL 지원을 갖춘 커스텀 캐시 구현
- **스마트 UserAgent 풀**: 자동 장애 복구 및 성능 모니터링을 갖춘 지능형 로테이션 시스템
- **동적 헤더**: 사실적인 브라우저 헤더 생성 (Accept, Accept-Language, User-Agent)
- **스마트 검색**: 향상된 결과 포맷팅을 갖춘 공식 Apple 검색 API
- **향상된 분석**: 선택적 관련 API, 플랫폼 호환성 및 유사성 분석
- **오류 복원력**: 포괄적인 오류 처리를 통한 우아한 성능 저하
- **타입 안전성**: Zod 런타임 검증을 갖춘 완전한 TypeScript
- **런타임 의존성 없음**: 서버는 하나의 번들 파일로 배포되며 설치할 node_modules가 없습니다

### 캐싱 전략

| 콘텐츠 타입 | 캐시 기간 | 캐시 크기 | 이유 |
|-------------|-----------|----------|------|
| API 문서 | 30분 | 500 항목 | 자주 액세스됨, 적당한 업데이트 |
| 검색 결과 | 10분 | 200 항목 | 동적 콘텐츠, 사용자별 |
| 프레임워크 인덱스 | 1시간 | 100 항목 | 안정적인 구조, 변경 빈도 낮음 |
| 기술 목록 | 2시간 | 50 항목 | 거의 변경되지 않음, 대용량 콘텐츠 |
| 문서 업데이트 | 30분 | 100 항목 | 정기 업데이트, WWDC 발표 |
| Apple Design 콘텐츠 | 2시간 | 100 항목 | HIG와 Design 페이지는 세션 동안 안정적 |
| Apple Design 리소스 | 2시간 | 20 항목 | 카탈로그 메타데이터는 페이지 읽기보다 덜 자주 변경됨 |

다운로드한 Apple Design 파일은 플러그인 디렉터리 밖에 캐시됩니다. 서버 프로세스마다 생성되는 임시 디렉터리 또는 `APPLE_DOCS_MCP_CACHE_DIR`로 지정한 디렉터리입니다("설정" 참조). 이 파일들은 MCP `resources/list`와 `resources/read`를 통해 노출됩니다.

## WWDC 데이터

모든 WWDC 비디오 데이터(2014-2026)는 **플러그인에 직접 번들링**되어 다음을 제공합니다:

- **네트워크 지연 없음**: WWDC 콘텐츠에 API 호출 불필요
- **100% 오프라인 액세스**: 인터넷 연결 없이 작동
- **속도 제한 없음**: 무제한 WWDC 검색 및 탐색
- **즉각적인 응답**: 모든 데이터가 로컬에서 사용 가능

포함된 데이터:

- **1,400개 이상의 WWDC 세션 비디오** 및 전체 대본
- 체계적인 탐색을 위한 **19개 주제 카테고리**
- **13년간의 콘텐츠** (2014-2026)
- 설치된 플러그인 버전당 **약 39 MB의 최적화된 JSON 데이터**

> **참고**: 최신 WWDC 콘텐츠를 받으려면 플러그인을 업데이트하세요.

## 설정

서버는 시작할 때 다음의 선택적 환경 변수를 읽습니다. Claude Code를 실행하는 셸에서 export하세요. 변수는 Claude Code를 시작하는 프로세스의 환경에 설정되어 있어야 합니다. GUI로 실행한 Claude Code는 셸 프로필에서 export한 변수를 인식하지 못합니다(Claude Code 2.1.285에서 확인, 공식 문서에는 없음).

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `APPLE_DOCS_MCP_CACHE_DIR` | 다운로드한 Apple Design 파일의 디렉터리 | 서버 프로세스마다 생성되는 임시 디렉터리 |
| `APPLE_DOCS_MCP_CACHE_MAX_BYTES` | 다운로드 캐시의 크기 제한(바이트) | 1073741824 (1 GiB) |
| `MCP_DEBUG` | `true`로 설정하면 디버그 로그 활성화 | 꺼짐 |
| `DEFAULT_ACCEPT_LANGUAGE` | Apple 서버로 보내는 Accept-Language 헤더 | `en-US,en;q=0.9` |
| `DISABLE_LANGUAGE_ROTATION` | `true`로 설정하면 Accept-Language 헤더 로테이션 중지 | 꺼짐 |
| `DISABLE_SEC_FETCH` | `true`로 설정하면 Sec-Fetch-* 헤더 제외 | 꺼짐 |
| `DISABLE_DNT` | `true`로 설정하면 DNT 헤더 제외 | 꺼짐 |
| `SIMPLE_HEADERS_MODE` | `true`로 설정하면 최소한의 요청 헤더 전송 | 꺼짐 |

서버에는 12개 이상의 사전 구성된 UserAgent 문자열(macOS, Windows, Linux의 Chrome, Firefox, Safari, Edge) 풀이 포함되어 있으며, 자동 장애 복구와 함께 로테이션됩니다.

## 개발

이 섹션은 유지 관리자용입니다. 플러그인 사용자는 필요하지 않습니다. 요구 사항: Node.js 22 이상과 pnpm(버전은 `package.json`의 `packageManager`로 고정됩니다).

```bash
pnpm install --frozen-lockfile   # 개발 의존성 설치
pnpm build                       # servers/apple-docs/index.js 와 THIRD_PARTY_LICENSES.txt 재생성
pnpm typecheck                   # tsc --noEmit
pnpm lint                        # eslint src
pnpm test                        # Jest 테스트 스위트
pnpm start                       # 빌드된 stdio 서버 실행 (node servers/apple-docs/index.js)
```

- **번들은 커밋됩니다.** `servers/apple-docs/index.js`는 Claude Code가 실행하는 파일이며, 사용자 컴퓨터에서 의존성 설치가 필요하지 않습니다. `src/` 또는 번들된 의존성을 변경한 후에는 `pnpm build`를 실행하고 결과를 커밋하세요. 커밋된 번들이 새 빌드와 다르면 최신성 테스트(`tests/bundle-freshness.test.ts`)가 실패합니다.
- **npm 또는 bun 잠금 파일을 두지 마세요.** `package.json` 옆에 `package-lock.json`, `npm-shrinkwrap.json`, `bun.lock`, `bun.lockb`가 있으면 Claude Code는 플러그인 루트에서 `npm ci`를 실행하여 모든 개발 의존성을 사용자 컴퓨터에 설치하게 됩니다. 이 저장소는 pnpm을 사용하며 Claude Code는 pnpm 잠금 파일을 무시합니다. 가드 테스트(`tests/plugin-lockfile-guard.test.ts`)는 이 파일들이 나타나면 실패합니다.
- **의존성 업데이트.** cheerio를 업그레이드하면 `scripts/build-bundle.mjs`에 있는 `load-parse` 엔트리로의 리디렉션을 다시 검증하세요(`pnpm build`와 독립 실행형 번들 테스트 실행).
- **릴리스.** 릴리스는 CPV 표준 파이프라인으로 수행합니다: `uv run python scripts/publish.py` (lint, 검증, 테스트, `plugin.json`·`package.json`·`pyproject.toml`의 버전 증가, changelog, 태그, 푸시, GitHub 릴리스). npm에는 아무것도 게시하지 않습니다.

## 기여

기여를 환영합니다! 시작하는 방법:

1. 저장소를 **Fork**
2. 기능 브랜치 **생성**: `git checkout -b feature/amazing-feature`
3. Conventional Commits 형식으로 변경사항 **커밋** (CI의 commitlint가 검사합니다): `git commit -m "feat: add amazing feature"`
4. 브랜치에 **푸시**: `git push origin feature/amazing-feature`
5. Pull Request **열기**

## 라이선스

MIT 라이선스 - 자세한 내용은 [LICENSE](LICENSE)를 참조하세요. 원본 저작권은 kimsungwhee에게, 추가된 부분의 저작권은 Emasoft에게 있습니다. 서버에 번들된 의존성의 라이선스는 [servers/apple-docs/THIRD_PARTY_LICENSES.txt](servers/apple-docs/THIRD_PARTY_LICENSES.txt)에 나열되어 있습니다.

## 면책조항

이 프로젝트는 Apple Inc.와 제휴하거나 승인받지 않았습니다. 교육 및 개발 목적으로 공개적으로 사용 가능한 Apple 개발자 문서 API를 사용합니다.

---

[문제 신고](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues) • [기능 요청](https://github.com/Emasoft/emasoft-apple-documentation-plugin/issues/new) • [소스](https://github.com/Emasoft/emasoft-apple-documentation-plugin)

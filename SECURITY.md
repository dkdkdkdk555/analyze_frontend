# 보안 점검 결과 (프론트엔드)

점검일: 2026-10-23 · 범위: 이 저장소(Cloudflare Pages 정적 사이트). 백엔드(Workers API) 코드는 저장소에 없어 호출 방식으로만 판단했습니다.

## 조치한 위험

| # | 등급 | 위험 | 위치 | 조치 |
| --- | --- | --- | --- | --- |
| 1 | 높음 | **AI 분석 결과 XSS**: 리뷰 내용은 누구나 쓸 수 있고, AI가 리뷰 속 HTML/스크립트를 그대로 출력하면 결과 화면에서 실행됨 | `analysis/analysis.js`, `mypage/my-analyses.js`, `analysis/group-analysis-result.js` | 모든 AI 출력값을 `escapeHtml()`로 이스케이프 |
| 2 | 높음 | **반사형 XSS**: URL의 `appName`, `iconUrl` 값이 그대로 `innerHTML`에 들어감. 조작된 링크 하나로 로그인 토큰(`localStorage`) 탈취 가능 | `analysis/group-analysis.js` (`?appName=`) | 이스케이프 + 아이콘 URL은 http(s)만 허용 |
| 3 | 높음 | **스토어 데이터 XSS**: App Store/Play 검색 결과의 앱 이름·개발사명이 그대로 `innerHTML`에 들어감 | `components/search-bar.js`, `components/header.js`, `analysis/group-analysis.js`, `app.js` | 이스케이프, `data-app` JSON 속성도 이스케이프 |
| 4 | 높음 | **인라인 `onclick` 문자열 주입**: 앱 이름을 `'`만 바꿔 `onclick="downloadDetailAsPDF('…')"`에 넣어 `\`나 `"`로 탈출 가능 | `mypage/my-analyses.js` | 인라인 핸들러 제거, `addEventListener`로 교체, 전역 함수 제거 |
| 5 | 중간 | **`javascript:` 링크**: URL의 `appStoreUrl`/`playStoreUrl`을 스토어 링크 `href`에 그대로 넣음 | `analysis/analysis.js`, `mypage/my-analyses.js` | `safeUrl()`로 http(s)만 허용 |
| 6 | 중간 | **CSS 주입**: 아이콘 URL을 `style="background-image:url('…')"`에, 점유율 값을 `style="width:…%"`에 그대로 넣음 | 검색 드롭다운 3곳, `group-analysis-result.js` | `cssUrl()` 사용, 점유율은 숫자로 변환 |
| 7 | 중간 | **버전 미고정 CDN 스크립트**: `marked`(항상 최신)와 FingerprintJS(`@4`)를 무결성 검증 없이 로드. CDN·패키지 변조 시 사이트 전체가 위험 | `policy/*.html`, `components/fingerprint.js` | 정확한 버전 고정 + SRI(`integrity`) 해시 |
| 8 | 중간 | **보안 응답 헤더 없음**: 클릭재킹(iframe 삽입), MIME 스니핑, 외부로 전체 URL 리퍼러 전송 | `_headers` | `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, HSTS, `Permissions-Policy` 추가 |
| 9 | 낮음 | URL 경로·쿼리에 ID를 인코딩 없이 연결 | `group-analysis-result.js`(`/api/groups/${id}`), `my-analyses.js`, `pricing.js`(PayPal client id) | `encodeURIComponent()` |
| 10 | 낮음 | 사용자 이름·이메일, 결제/크레딧 내역 문구(그룹명 포함), 결제 상태 등을 이스케이프 없이 렌더링 | `header.js`, `payment-history.js`, `credit-history.js`, `rating-chart.js` | 이스케이프 |
| 11 | 낮음 | `localStorage`의 `lang` 값이 `constructor` 같은 프로토타입 키면 검증을 통과 | `components/i18n.js` | `Object.hasOwn()`으로 검사 |

공통 도구는 `components/sanitize.js`에 있습니다.

- `escapeHtml(value)`: HTML 텍스트와 따옴표로 감싼 속성값용
- `safeUrl(url)`: http(s)가 아니면 빈 문자열
- `cssUrl(url)`: `background-image` 값

**규칙: 외부에서 온 값(스토어, AI, URL, 서버 응답)을 `innerHTML` 템플릿에 넣을 때는 반드시 `escapeHtml()`을 거칩니다. 링크와 이미지 주소는 `safeUrl()`을 먼저 거칩니다.**

### 검증

Playwright로 API·iTunes 응답을 악성 값(`<img src=x onerror=…>`, `javascript:` URL)으로 바꿔 6개 화면을 열었습니다(홈 검색, 그룹 추가, URL 파라미터 그룹 화면, 단일 분석 결과, 그룹 결과, 마이페이지 상세).

| 대상 | 결과 |
| --- | --- |
| 수정 전 코드 | 6개 모두 스크립트 실행됨 |
| 수정 후 코드 | 6개 모두 실행되지 않음 |

검색 결과 클릭, 그룹 추가, PDF 버튼 같은 기존 동작도 함께 확인했습니다.

SRI 해시는 npm 패키지(`marked@18.0.14`의 `lib/marked.umd.js`, `@fingerprintjs/fingerprintjs@4.6.2`의 `dist/fp.min.js`)의 파일로 계산했습니다. jsDelivr는 npm 파일을 그대로 제공하므로 값이 같아야 합니다. 그래도 배포 후 약관 페이지와 가입 동의 흐름이 정상인지 한 번 확인해 주세요.

참고로 기존 주소 `marked/marked.min.js`는 최신 marked(v18)에 해당 파일이 없습니다. 그래서 약관 페이지가 이미 로드 실패 상태였을 가능성이 있습니다.

## 남은 위험 (후속 작업 필요)

| 등급 | 위험 | 필요한 작업 |
| --- | --- | --- |
| 높음 | **로그인 JWT를 `localStorage`에 저장**: XSS가 하나라도 생기면 토큰이 탈취됨 | 백엔드에서 `HttpOnly; Secure; SameSite` 쿠키로 발급하도록 변경(백엔드 작업) |
| 높음 | **스크립트 CSP 없음**: 이번 헤더는 iframe·플러그인·`<base>`만 막음. 인라인 스크립트(gtag 설정, `tailwind.config`, AdSense)와 인라인 핸들러(`onerror`, `onclick`) 때문에 `script-src`를 걸 수 없음 | Tailwind 빌드 전환, 인라인 스크립트를 파일로 분리한 뒤 `script-src` 허용 목록 CSP 적용. 처음엔 `Content-Security-Policy-Report-Only`로 시험 |
| 중간 | **Tailwind Play CDN**(`cdn.tailwindcss.com`): 버전·SRI 없이 22개 페이지에서 실행되는 런타임 컴파일러. 공식적으로 운영용이 아님 | Tailwind CLI로 CSS를 빌드해 정적 파일로 배포 |
| 중간 | **로그인 코드가 GA로 전송될 수 있음**: `?auth_code=`가 붙은 주소로 돌아올 때, 코드를 지우기 전에 gtag가 `page_location`으로 전체 URL을 보냄. 60초 1회용이라 피해는 제한적 | gtag 설정 전에 `auth_code`/`consent_code`를 URL에서 지우거나, 코드를 URL fragment로 전달 |
| 확인 필요 | **백엔드 권한 검사**: `/api/groups/:id`는 인증 없이 호출됨 | ID를 아는 사람 누구나 그룹 결과를 볼 수 있는지, ID가 추측 불가능한지 확인 |
| 확인 필요 | **결제 금액 검증**: `payment-success`가 URL의 `amount`를 서버로 보냄 | 서버가 주문 금액을 자체 기록과 대조하는지 확인 |
| 확인 필요 | **무료 분석 남용**: 비회원 한도·신규 크레딧 중복 방지가 브라우저 지문에 의존 | 서버 측 IP·계정 기반 제한이 함께 있는지 확인 |
| 수용 | PayPal·Paddle·AdSense·GA 스크립트는 공급사가 수시로 바꾸므로 SRI 적용 불가 | 공급사 신뢰로 수용. CSP 적용 시 도메인 허용 목록으로 범위 제한 |

# 제작 화면 플러그인 정적 검사(plugin-static-v2)

`clack.skill.json`의 `authoring.plugin`으로 제작 화면 플러그인을 선언하면 서버가 번들을 구문 트리(JS·HTML·CSS)로 검사한다. 위험 기능을 쓰지 않는다고 증명할 수 있는 코드만 통과하고, 판단할 수 없는 코드는 오류로 처리된다. 상세 안내의 정본은 크리에이터 가이드 `/ko/guide/reference/templates/editor-plugins`(T09)와 실습 과정 `/ko/guide/courses/center-editor-plugin`(T05)이며, 크리에이터 센터 `/ko/creator/skills/help/plugin`에도 같은 안내가 있다.

## 선언

`bundle`(진입 HTML 경로)·`sha256`·`fields`(1개 이상, `^[a-z][a-z0-9_-]{0,31}$`)·`permissions`·`purpose`(1~200자)가 필수다. 권한은 `getFormSchema`, `getFormValues`, `setFormValues`, `listApprovedAssets`, `requestAssetUpload`만 있다. 권한·필드가 늘어나면 크리에이터에게 다시 동의를 받아야 한다.

## 번들 제한

이 플러그인 번들은 스킬 패키지 전체 한도(10 MiB ZIP 등)와 별개로 더 작다: 파일 50개, 파일당 512 KiB, 전체 2 MiB, 코드 파일 합계 512 KiB 이하. 형식은 `html`·`js`·`mjs`·`css`·`json`·`png`·`jpg`·`webp`·`gif`·`woff`·`woff2`만 허용된다.

## 진입 HTML

CSP `<meta>`를 한 번만 두고 `default-src 'none'`으로 시작한다. `connect-src`는 `'none'`만, `script-src`·`style-src`는 `'self'` 또는 해시, `img-src`·`font-src`는 `'self'` 또는 `data:`만 쓴다. 인라인 스크립트·인라인 이벤트 속성·`meta refresh`·외부 URL 참조는 금지이며 `<link>`는 `rel="stylesheet"`만 허용한다.

## 스크립트에서 금지되는 것

- 동적 코드: `eval`, `Function`, `WebAssembly`
- 네트워크: `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `Worker`, `Image`
- 저장소: `localStorage`, `sessionStorage`, `indexedDB`, 쿠키
- 페이지 이동: `location` 쓰기, `assign`, `replace`, `history`, `open`, `top`
- 위험 DOM 쓰기: `innerHTML` 등
- 계산된 멤버 접근(`obj[key]`), 전역 별칭(`self`·`globalThis`·`const w = window`), `Reflect`·`Proxy`·`constructor` 반사
- `atob`·`escape` 같은 문자열 난독화

`import`는 번들 안 상대 경로의 `.js`·`.mjs`만 허용된다.

## 메시지와 로드 토큰

`postMessage` 대상은 `https://` 리터럴·받은 이벤트의 `origin`·fragment의 `clack-parent` 값만 허용되고 `'*'`는 금지다. 수신 시 `event.origin`·`event.source`를 확인하고 메시지에 `nonce`·`request_id`를 담는다.

iframe 주소의 실행 토큰은 300초 동안 유효하고 번들 안 상대 경로 자원도 같은 토큰으로 검사된다. 센터는 만료 30초 전에 새 토큰으로 플러그인을 다시 연다. 필요한 자원은 첫 로드 때 불러오고, 상태는 `setFormValues`로 저장한 뒤 다시 열렸을 때 `getFormValues`로 이어간다.

## 심사

업로드는 구조 오류만 422 `SKILL_PLUGIN_INVALID`로 거부하며, 코드 판정은 줄 번호와 함께 심사 근거로 남는다. 관리자가 번들 소스를 직접 확인한 뒤 승인하며 플러그인과 결과 콘텐츠는 자동 공개되지 않는다. 이전 규칙(v1)으로 검사된 대기 플러그인은 승인할 수 없으므로(409 `PLUGIN_STATIC_CHECK_STALE`) 새 버전으로 다시 올린다.

크리에이터 센터·가이드는 `/ko`·`/en` 주소를 사용하며 로그인 상태에서는 앱 언어 설정을 따릅니다. 콘텐츠는 SDK 1.2.0의 `clack.locale` 또는 `window.__clack_env?.locale`에서 앱 언어(`language`)·기기 지역(`region`)·BCP 47 태그(`tag`)를 동기적으로 읽습니다. 번역은 `language`로 고르고 숫자·날짜는 `tag`를 `Intl`에 전달합니다. 기존 `me().locale`은 `ko|en`이고 `me().locale_tag`가 전체 태그입니다.

새 다국어 계약은 개발 센터와 최신 staging 테스터 앱에서 제공하며, 운영에서는 센터 초기 출시와 함께 별도로 활성화합니다. 상세 계약과 예제는 개발 센터의 가이드 P11(`/ko/guide/reference/platform/multilingual-content`)을 확인하세요. 앱 언어 환경값이 없는 구버전 앱에서는 `clack.locale.source`가 `browser`이며 브라우저 언어로 대체됩니다.

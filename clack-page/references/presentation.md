# 공통 메뉴·화면 표시와 페이지 HTML 규칙

## 공통 메뉴와 호환 값

모든 콘텐츠·미리보기·페이지는 같은 메뉴를 사용한다. 메뉴는 기본으로 숨겨지며 세 손가락 탭으로 표시·숨김을 전환한다. 스크롤이나 canvas 제스처는 메뉴 상태를 바꾸지 않는다. 스크린 리더 사용자를 위한 별도 메뉴 전환 버튼도 있다. 앱 확인은 메뉴를 연 뒤 위쪽 ✓를 눌러 확인 안내와 확인 버튼을 펼친다.

제작자는 `light`·`dark` 색상만 정한다. 저장된 `header_mode`의 `fixed`, `scroll_hide`, `translucent_scroll_hide`, `floating_close`, `floating_close_safe_area`는 기존 데이터·통신 호환용이며 모두 같은 메뉴로 표시된다. 새 업로드의 `--header`는 생략할 수 있고 기본값은 `fixed`다. `page presentation`은 현재 `--header`가 필수이므로 원본 값을 그대로 전달한다. 현재 CLI는 다섯 값을 모두 받으며, 구버전이 원본 값을 받지 못하면 업데이트하거나 MCP/REST를 사용한다.

## HTML을 직접 작성·수정할 때

호스트가 본문을 기기의 안전 영역 안쪽에 놓는다. `--clack-safe-top/bottom/left/right`와 `--clack-header-height`는 모두 `0px`다. `--clack-viewport-height`는 현재 HTML 뷰포트 높이이며 회전·키보드에 따라 갱신한다. 메뉴를 열어도 본문 크기·위치가 바뀌지 않는다. 헤더·닫기 버튼용 빈 띠나 56px·72px 회피 여백은 예약하지 않는다. 제목·링크·입력의 일반 여백은 콘텐츠 디자인에 맞게 정한다.

안전 영역을 중복 적용하는 `env(safe-area-inset-*)`는 쓰지 않는다. `env()`는 아래 자동 승인 대상 CSS 함수 목록에도 없어 관리자 검토로 넘어간다(`CSS_FUNCTION_REQUIRES_REVIEW`). `var()`의 대체값에도 `env()`를 넣지 않는다.

```css
html, body { margin: 0; }
.hero { position: relative; min-height: var(--clack-viewport-height, 100dvh); }
.hero-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero-copy { position: relative; padding: 24px 16px; }
```

문서 스크롤·내부 스크롤·canvas 모두 공통 메뉴를 사용한다. 기존 `data-clack-scroll-root`나 스크롤 메시지는 메뉴 전환을 제어하지 않는다. 큰 글꼴·스크린 리더·회전·키보드를 포함해 앱에서 콘텐츠 표시를 확인한다.

앱 안의 다른 화면으로 이동할 때는 `<a href>` 대신 아래 메시지를 쓴다. `target`은 `profile`·`space`·`content`이고 ID는 문자열로 보낸다. 실제 접근 권한은 앱·서버가 확인한다.

```js
window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'clack.page.navigate', target: 'profile', id: '123' }));
// 같은 대상의 기본 화면으로 돌아간다.
window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'clack.page.close' }));
```

페이지에는 정적 HTML·CSS·JavaScript와 번들 자산만 사용한다. 외부 스크립트·통신·iframe은 지원하지 않으며, 걸리는 부분은 업로드는 되어도 앱에서 빈칸으로 보이니 앱 확인 단계에서 반드시 실제 표시를 검토한다.

## 자동 승인 조건(참고)

이 환경에서 자동 승인이 켜져 있으면 다음을 모두 지킨 버전은 관리자 개입 없이 승인될 수 있다. CLI로 이 판정을 바꾸거나 우회할 수 없다.

- 정적 HTML·CSS만 쓰고, 이미지는 `<img src="번들 안 상대 경로" alt width height>`로만 넣는다.
- 새로 판정해야 할 이미지가 8장 이하다(이미 심사를 통과한 이미지는 다시 포함하지 않는다).
- HTML·CSS 텍스트 합계 100 KiB 이하다.
- 개인 홈은 전체 이용가, 세계관은 그 세계관의 등급 상한 이내다.
- CSS 함수는 다음만 자동 승인 대상이다: 색상(`rgb`·`rgba`·`hsl`·`hsla`·`hwb`·`lab`·`lch`·`oklab`·`oklch`·`color`·`color-mix`), 크기·값 계산(`calc`·`min`·`max`·`clamp`·`var`·`repeat`·`minmax`·`fit-content`), 그라디언트(`linear-gradient`·`radial-gradient`·`repeating-linear-gradient`·`repeating-radial-gradient`), 2D 변형(`translate`·`translatex`·`translatey`·`scale`·`rotate`). 그 밖의 함수(웹 표준 `env()` 포함)는 목록에 없다는 이유만으로 관리자 검토로 넘어간다.
- @-규칙은 `@media`·`@supports`·`@layer`·`@container`만 자동 승인 대상이다(`@keyframes`·`@font-face`·`@import` 등은 관리자 검토).

스크립트·인라인 이벤트·CSS 애니메이션·전환(`animation`·`transition`)·CSS 이스케이프(`\`)나 `url()` 배경·`srcset`/`<picture>`·`data:`나 원격 이미지 참조·`<video>`/`<audio>`·`#`이 아닌 외부 링크가 있으면 자동 승인 대상에서 빠지고 관리자 검토로 넘어간다.

# 헤더·화면 표시와 페이지 HTML 규칙

## 헤더 값

| 값 | 표시 방식 |
|---|---|
| `fixed` | 기본 고정 헤더 |
| `scroll_hide` | 아래로 스크롤하면 숨고 위로 스크롤하면 나타나는 헤더 |
| `translucent_scroll_hide` | 본문이 비치는 반투명 헤더와 스크롤 숨김 |
| `floating_close` | 상단 바 없이 닫기 버튼만 표시 |

색상은 `light` 또는 `dark`다. 닫기 버튼은 앱이 제공하며 헤더를 숨겨도 사용할 수 있다. 새 공개 홈·세계관 꾸미기는 `floating_close`(전체 화면, 닫기 버튼만)가 기본 권장이다.

## HTML을 직접 작성·수정할 때

- 배경·대표 이미지는 화면 가장자리까지 채우고, 제목·링크·입력 같은 상호작용 요소에만 안전 영역과 닫기 버튼을 피할 여백을 둔다. `body`·`main` 전체에 헤더 높이만큼 빈 공간을 만들면 전체 화면의 이점이 사라진다.
- 앱이 제공하는 CSS 변수: 안전 영역 `--clack-safe-top/bottom/left/right`, 화면 높이 `--clack-viewport-height`. `--clack-header-height`는 기존 호환용으로 고정 헤더에서는 0이다(닫기 버튼 모드의 배경 전체를 밀어내는 용도로 쓰지 않는다).

```css
html, body { margin: 0; }
.hero { position: relative; min-height: var(--clack-viewport-height, 100dvh); }
.hero-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hero-copy {
  position: relative;
  padding-top: calc(var(--clack-safe-top, 0px) + 72px);
  padding-bottom: calc(var(--clack-safe-bottom, 0px) + 24px);
  padding-left: calc(var(--clack-safe-left, 0px) + 16px);
  padding-right: calc(var(--clack-safe-right, 0px) + 16px);
}
```

닫기 버튼은 상단 왼쪽 안전 영역에서 오른쪽으로 약 72px, 아래로 약 56px 범위를 차지하므로 이 범위에는 링크·입력을 두지 않는다. 문서 전체 스크롤이 기본이며, 내부 요소를 주 스크롤 영역으로 쓴다면 그 요소 하나에 `data-clack-scroll-root`를 붙인다. canvas나 자체 가상 스크롤처럼 실제 스크롤 위치가 없는 화면은 앱에서 직접 확인한 뒤 헤더 모드를 정한다.

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

스크립트·인라인 이벤트·CSS 애니메이션이나 `url()` 배경·`srcset`/`<picture>`·`data:`나 원격 이미지 참조·`<video>`/`<audio>`·`#`이 아닌 외부 링크가 있으면 자동 승인 대상에서 빠지고 관리자 검토로 넘어간다.

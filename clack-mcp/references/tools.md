# MCP 도구 입력

도구 이름·입력 스키마는 현재 서버의 도구 목록을 우선한다. 아래 예시는 해당 scope가 있을 때 사용한다. ID와 내용은 실제 사용자 요청으로 바꾼다. 공통 안내·신원·메타는 `get_guide`, `whoami`, `get_meta`에 빈 객체 `{}`를 넣는다.

## 상품

| 도구 | 입력 예시 |
|---|---|
| `list_my_products` | `{"status":"selling","limit":50}` |
| `get_product` | `{"id":123}` |
| `search_products` | `{"query":"아크릴","page":1,"per_page":20}` |
| `update_product` | `{"id":123,"changes":{"price":12000}}` |
| `set_product_status` | `{"id":123,"status":"sold"}`로 미리보기, 승인 후 `confirm:true` |
| `bump_product` | `{"id":123}` |
| `bulk_bump_products` | `{}`. 전체 끌어올리기를 요청받은 경우만 사용 |
| `hide_product`, `unhide_product` | `{"id":123}` |
| `delete_product` | `{"id":123}`로 미리보기, 승인 후 `confirm:true` |

`create_product` 필수 필드는 `type`, `images`, `name`, `category`, `price`, `description`이다. `type`·`category`는 `get_meta`의 실제 값을 사용한다. 아래 URL은 구조 예시다. 실행할 때는 실제 `finalize_image_upload` 결과의 `originalUrl`로 바꾼다.

```json
{
  "type": "sell",
  "images": ["https://storage.clack.kr/실제-업로드-결과.webp"],
  "name": "아크릴 스탠드",
  "category": "아크릴 > 아크릴 스탠드",
  "price": 12000,
  "description": "사용자가 확인한 상품 상태와 거래 조건",
  "lang": "ko",
  "currency": "KRW"
}
```

상품명은 1~99자, 이미지는 1~12개다. 생성은 `lang=en`이면 USD, 나머지는 KRW다. KRW 가격·배송비는 0 이상의 정수, USD는 소수점 둘째 자리까지다. 수정은 기존 통화를 확인하고 바꿀 필드만 `changes`에 넣는다. `images`를 넣으면 최종 전체 목록을 전달한다. 상태는 `selling|trading|sold`이며 `sold`만 확인이 필요하다.

## 일반 글과 댓글

| 도구 | 입력 예시 |
|---|---|
| `list_boards` | `{}` |
| `list_my_posts` | `{"limit":50}` |
| `get_post` | `{"id":123}` |
| `list_comments` | `{"post_id":123,"limit":50}` |
| `create_post` | `{"type":"실제-board_id","subject":"제목","content":"본문"}` |
| `update_post` | `{"id":123,"changes":{"content":"수정 본문"}}` |
| `delete_post` | `{"id":123}`로 미리보기, 승인 후 `confirm:true` |
| `create_comment` | `{"post_id":123,"content":"댓글"}`, 답글은 `parent_id` 추가 |
| `delete_comment` | `{"post_id":123,"comment_id":456}`로 미리보기, 승인 후 `confirm:true` |

`create_post.type`은 `get_meta.boards`의 실제 `board_id`다. `board_type=image`이면 이미지가 최소 1개, 그 외면 `subject`가 필수다. 본문은 항상 필수, 이미지는 최대 12개다. `can_write:false`인 게시판에는 쓰지 않는다. 피드는 활성 `board_id=challenge`의 실제 유형을 확인한다. 삭제는 연결 댓글에도 영향을 준다. 댓글 수정 도구는 없고 답글은 한 단계다.

## 채널 포스트·시리즈

| 도구 | 입력 예시 |
|---|---|
| `get_my_channel` | `{}` |
| `list_channel_posts` | `{"status":"draft","limit":50}` |
| `get_channel_post` | `{"id":456}` |
| `list_channel_series` | `{"page":1,"per_page":20}`. `handle` 생략 시 내 채널 조회 |
| `update_channel_post` | `{"id":456,"changes":{"status":"published"}}` |
| `delete_channel_post` | `{"id":456}`로 미리보기, 승인 후 `confirm:true` |
| `create_channel_series` | `{"channel_id":123,"title":"시리즈 제목"}` |
| `update_channel_series` | `{"id":789,"changes":{"is_completed":true}}` |

`create_channel_post`는 다음 형식이다. MCP는 마크다운을 변환하지 않는다. 원고를 아래 블록으로 작성한다.

```json
{
  "channel_id": 123,
  "title": "포스트 제목",
  "status": "draft",
  "content": [{ "type": "paragraph", "text": "확정한 본문" }]
}
```

본문 블록은 `paragraph`, `image`, `divider`만 있다. `image`는 완료된 CDN `url`과 실제 `width`, `height`(각 1~20,000)가 필수, `alt`는 최대 500자다. 문단은 최대 20,000자, 본문은 1~500개 블록, 제목은 1~200자, 태그는 최대 10개·각 1~50자다. 포스트 상태는 `draft|published`다. 목록 필터의 `hidden`을 변경 상태로 쓰지 않는다. 시리즈 제목은 최대 100자, 설명은 최대 500자다.

현재 MCP에는 채널 자체 생성·수정, 시리즈 상세 조회·삭제, 게시글 상품 연결 도구가 없다. 이 기능이 필요하면 CLI나 앱을 사용한다.

## 프로필·배송지

| 도구 | 입력 예시 |
|---|---|
| `get_my_profile`, `list_addresses` | `{}` |
| `update_my_profile` | `{"name":"확정한 닉네임"}` |
| `update_seller_intro` | `{"seller_intro":"확정한 판매자 소개"}` |
| `update_notification_settings` | `{"allow_notification":true,"marketing_push_consent":false,"langs":["ko"]}` |
| `update_address` | `{"id":123,"changes":{"label":"집"}}` |
| `delete_address` | `{"id":123}`로 미리보기, 승인 후 `confirm:true` |
| `set_default_address` | `{"id":123}` |

`update_my_profile`은 `name`(1~16자), `instagram`, `twitter`, `birth`(실제 `YYYY-MM-DD`), `avatar`(클랙 CDN HTTPS URL), `allow_notification`만 지원한다. 계좌 정보를 넣지 않는다.

`create_address`는 빈 값이 아닌 `name`, `contact`, `zipcode`, `address`, `address_detail`이 필수이고 `label`, `is_default`가 선택이다. 실제 주소는 도구 입력에만 전달하고 공개 예시·답변에 원문 전체를 반복하지 않는다. 여러 알림 설정은 순차 처리되며 실패의 `completed`를 확인한다. 비밀번호·이메일 인증 도구는 없다.

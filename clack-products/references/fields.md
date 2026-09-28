# 상품 필드

## 생성 JSON

`product.json`과 `images/stand.jpg`를 사용자 작업 폴더에 준비한다. 예시 가격·설명은 실제 판매 자료로 바꾼다.

```json
{
  "type": "sell",
  "images": ["./images/stand.jpg"],
  "name": "아크릴 스탠드",
  "category": "아크릴 > 아크릴 스탠드",
  "price": 12000,
  "description": "사용자가 확인한 상품 상태와 거래 조건",
  "lang": "ko",
  "currency": "KRW"
}
```

| 필드 | 계약 |
|---|---|
| `type` | 필수. `sell`, `buy`, `groupbuy`, `randombox`, `commission` |
| `images` | 필수. 1~12개 로컬 경로 또는 이미지 URL. 직접 업로드할 로컬 이미지는 10MB 이하 |
| `name` | 필수. 공백 제거 후 1~99자 |
| `category` | 필수. `clack product categories --json`의 저장용 문자열. 표시 이름만 임의 전달하지 않기 |
| `price` | 필수. 0 이상. 통화에 맞는 소수점 제한 |
| `description` | 필수. 공백만 있는 내용 불가 |
| `lang`, `currency` | 생성 기본 `ko`·`KRW`. `lang=en`은 `USD`, 그 외는 `KRW` |
| `brand`, `size`, `condition` | 선택. 사용자 자료에서 확인한 문자열. `size`는 null 가능 |
| `delivery_fee` | 선택. 0 이상 금액 또는 null |
| `safe_trade_fee_payer` | 선택. `buyer` 또는 `seller` |
| `shipping_options` | 선택. JSON으로 `{method_code, fee, is_default?}` 배열. 실제 코드는 `product shipping-methods` 확인 |
| `extra_data` | 선택 문자열 또는 null. 구조를 알지 못하면 생략 |

KRW 금액은 가격·배송비 모두 정수다. USD는 소수점 둘째 자리까지 허용한다. 생성의 언어와 통화 조합을 임의로 바꾸지 않는다. 수정에는 기존 통화를 조회하여 같은 통화로 금액을 작성하며 `lang` 변경은 지원하지 않는다.

이미지·설명·배송 정보를 일부 수정할 때는 변경할 필드만 JSON에 넣는다. `images`를 전달하면 원하는 최종 전체 목록을 전달한다. CLI가 업로드한 첫 이미지의 `thumbnail_400`을 처리하므로 썸네일 주소를 지어내지 않는다. 원격 이미지 주소가 없다면 로컬 파일을 업로드한다.

```sh
clack product update 123 -f product-changes.json --dry-run --json
clack product update 123 -f product-changes.json --json
```

`republish`는 수정 JSON의 선택 boolean이며 게시 시각을 갱신한다. 사용자가 게시 시각 갱신을 요청한 경우만 포함한다. 단순 가격 수정에 추가하지 않는다.

# 게시판 유형과 글 입력

`clack post boards --json`은 활성 게시판의 `board_id`, `board_type`, `can_write`를 반환한다. ID와 작성 권한은 현재 결과를 사용한다.

| 유형 | 작성 규칙 |
|---|---|
| `image` | `content`와 이미지 1~12개 필수. `subject`는 선택 |
| 그 외 유형 | `content`, `subject` 필수. 이미지는 선택이며 최대 12개 |
| `admin-only` | 위 제목 규칙에 더해 `can_write:true`일 때만 작성 |

`--board <board_id>`와 `--feed`는 함께 사용할 수 없다. 피드의 식별자는 `challenge`지만 실제 활성 여부와 이미지 유형은 조회로 확인한다. 권한 오류를 다른 보드로 자동 우회하지 않는다.

`post.json`에는 다음처럼 실제 조회한 `board_id`를 `type`에 넣는다. 아래 `BOARD_ID`는 예시 표식이므로 실행 전 교체한다.

```json
{
  "type": "BOARD_ID",
  "subject": "확정한 제목",
  "content": "확정한 본문",
  "images": ["./photo.jpg"],
  "lang": "ko"
}
```

- `type`과 `content`는 필수이고 공백만 있는 본문은 허용하지 않는다.
- `lang`은 두 글자 소문자 언어 코드다.
- 이미지의 로컬 상대 경로는 JSON 파일 기준이다. 파일당 10MB 이하여야 하며 CLI가 자동 업로드한다.
- 옵션으로 본문을 넣을 때 `--content`와 `--content-file`은 함께 사용할 수 없다. 일반 글은 문자열 본문이며 채널 포스트용 블록 JSON을 넣지 않는다.
- 업데이트 JSON은 변경할 필드만 포함한다. 게시판 변경을 요청하지 않았다면 `type`을 바꾸지 않는다. 이미지 게시판의 이미지 목록을 빈 배열로 변경하지 않는다.
- 게시글 삭제는 연결 댓글 삭제에도 영향을 준다. 미리 대상과 영향을 설명하고 사용자에게 구체적 삭제 승인이 있는지 확인한다.

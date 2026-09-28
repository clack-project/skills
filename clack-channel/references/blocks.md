# 채널 본문과 마크다운 변환

## 블록 계약

채널 포스트 생성에는 `channel_id`, `title`, `content`, `status`가 필요하다. CLI는 생략한 채널 ID를 내 채널에서 조회하고 기본 상태를 `draft`로 채운다.

```json
{
  "channel_id": 123,
  "title": "확정한 제목",
  "status": "draft",
  "content": [
    { "type": "paragraph", "text": "본문 문단" },
    { "type": "divider" },
    { "type": "image", "url": "./photo.jpg", "alt": "사진 설명" }
  ],
  "tags": ["작업기록"]
}
```

이 예시는 CLI 입력이다. CLI는 로컬 이미지의 크기를 측정하고 업로드한 CDN URL로 치환한다. 원격 MCP의 이미지 블록은 업로드가 끝난 HTTPS CDN `url`과 실제 `width`, `height`가 필수이며 로컬 경로를 받지 않는다.

| 항목 | 제한 |
|---|---|
| `title` | 1~200자 |
| `content` | 1~500개 블록 |
| 문단 | `{type:"paragraph",text,marks?}`, 문단당 최대 20,000자 |
| 구분선 | `{type:"divider"}` |
| 이미지 | `{type:"image",url,width,height,alt?}`, 너비·높이 1~20,000, alt 최대 500자 |
| 태그 | 최대 10개, 각각 1~50자 |
| `status` | `draft` 또는 `published` |

문단 `marks`는 최대 200개이며 `range:[시작,끝]`, `style:"bold"|"italic"|"link"`, 링크의 `href`를 사용한다. 범위는 JavaScript 문자열 인덱스이고 끝은 미포함이다. 범위를 모르면 마크다운 변환기를 사용한다. 링크는 HTTP(S)만 허용된다.

`series_id`, `series_order`, `thumbnail`은 선택이다. 기존 연결 해제는 수정 JSON에 `series_id:null`처럼 명시할 수 있다. ID와 순서는 양의 정수다. 썸네일 이미지와 본문 이미지는 실제 사용자 파일이나 업로드가 완료된 클랙 CDN 주소를 사용한다.

## 마크다운 변환

- 일반 문단·빈 줄·줄바꿈을 문단으로 변환한다.
- `**굵게**`, `*기울임*`, `[링크](https://clack.kr)`는 문단의 서식 범위로 변환한다.
- 한 줄에 단독으로 있는 `![설명](./photo.jpg)`는 이미지 블록이다. 이미지 상대 경로는 마크다운 파일 기준이다.
- `---`, `***`, `___`는 구분선이다.
- 제목·목록·인용은 접두 기호를 제거한 일반 문단으로 변환하고 경고한다.
- 코드 블록은 일반 문단으로 변환한다. 문단 안의 이미지 문법은 텍스트로 남고 경고한다.
- 지원하지 않는 서식을 원래대로 렌더링한다고 설명하지 않는다. 변환 경고를 확인하고 사용자 의도에 맞게 원고를 조정한다.

`--from-markdown`과 JSON의 `content`는 함께 사용할 수 없다. 생성 제목을 생략하면 확장자를 뺀 파일명이 제목이 된다. 의도한 제목이 있으면 `--title`을 명시한다. 원격 이미지는 `https://storage.clack.kr`의 실제 이미지여야 하며 CLI가 크기를 읽는다. 로컬 파일과 원격 읽기 모두 10MB 상한을 지킨다.

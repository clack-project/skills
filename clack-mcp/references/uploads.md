# MCP 이미지 업로드

로컬 파일을 업로드하려면 클라이언트에 파일을 읽고 HTTPS PUT을 실행할 기능이 있어야 한다. MCP 서버에 로컬 경로를 전달해도 업로드되지 않는다. 해당 기능이 없으면 사용자가 앱 또는 CLI로 올린 실제 CDN URL을 사용한다.

필요 scope는 `product:write` 또는 `content:write`다. 프로필 쓰기만으로는 새 이미지 업로드 권한이 생기지 않는다. 이미지 한도는 `get_meta`의 값을 확인한다.

## 순서

1. 파일 형식·크기를 확인한다. JPEG·PNG·WebP·GIF·AVIF, 최대 10MB·2,500만 화소다. GIF는 첫 프레임의 정지 WebP가 되므로 애니메이션 보존을 약속하지 않는다.
2. `request_image_upload({"filename":"photo.jpg","content_type":"image/jpeg"})`를 호출한다. 응답 `data`의 `upload_id`, `upload_url`, `method`, `headers`, `expires_at`, `max_bytes`를 사용한다. 이 요청은 일일 이미지 한도를 예약한다.
3. 응답의 `method:"PUT"`과 `headers`를 그대로 사용하여 `upload_url`에 파일 바이트를 보낸다. multipart나 JSON으로 감싸지 않는다. **이 PUT에는 CLACK PAT·쿠키를 보내지 않는다.** 서명 URL 자체가 임시 인증 정보다.
4. PUT 성공을 확인한 뒤 같은 토큰으로 `finalize_image_upload({"upload_id":"발급된-UUID"})`를 호출한다. 15분 만료 안에 완료한다.
5. 완료 결과의 `originalUrl`, `thumbnail400Url`을 사용한다. 완료 응답에는 크기가 없으므로 이미지 블록에 넣을 너비·높이는 반환된 CDN 이미지의 실제 바이트를 읽어 측정한다. 정규화 전 파일 크기를 그대로 추정하지 않는다. 서명 URL을 상품·본문 이미지 주소로 저장하지 않는다.

업로드 URL·필수 헤더·UUID는 응답 그대로 사용하고 주소를 조립하지 않는다. HTTP 클라이언트의 자세한 요청 로그를 끄고 서명 URL을 일반 셸 기록·공개 산출물에 남기지 않는다. 최종 이미지 공개 게시 자체는 사용자가 요청한 콘텐츠 작성 범위 안에서 수행한다.

## 실패와 재시도 경계

- `UPLOAD_EXPIRED`: 기존 요청은 더 이상 사용할 수 없다. 파일과 작업 범위를 확인하고 새 요청을 받는다.
- `UPLOAD_OWNER_MISMATCH`: 다른 토큰으로 바꾸어 진행하지 않는다. 원래 요청 토큰·계정을 확인한다.
- `UPLOAD_NOT_FOUND`: PUT의 완료 여부와 원래 UUID를 확인한다. 임의 UUID를 만들지 않는다.
- `UPLOAD_CONFLICT`: 이미 처리 중이거나 처리된 업로드다. 같은 finalize를 반복 호출하지 않는다.
- `INVALID_IMAGE`, 413, 415: 실제 형식·크기·화소 수를 수정한다. finalize에서 소비된 요청은 재사용하지 않는다.
- 네트워크 실패·응답 유실·5xx: 성공 여부가 미확정이므로 `request_image_upload`·PUT·finalize 전체를 자동 반복하지 않는다. 완료 응답이 유실된 경우 서버가 이미 이미지를 생성했을 수 있다. 상태를 확인하고 사용자 요청 범위와 남은 한도를 고려해 다음 시도를 결정한다.

서버는 업로드 요청을 계정·토큰에 묶고 중복 finalize를 거부한다. 헤더·확장자만 바꾸어 검증·한도·소유권을 우회하지 않는다. 콘텐츠 등록이 실패해도 완료된 이미지 URL을 보관하여 불필요한 재업로드를 피한다.

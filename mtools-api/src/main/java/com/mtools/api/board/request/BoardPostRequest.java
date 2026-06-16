package com.mtools.api.board.request;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * API 요청용 게시글 DTO.
 * <p>
 * Vue/터미널에서 POST·PUT body JSON을 이 형태로 받는다.
 */
@Schema(description = "게시글 등록/수정 요청")
public record BoardPostRequest(
		@Schema(description = "제목", example = "테스트2")
		String title,
		@Schema(description = "본문", example = "본문 내용")
		String text,
		@Schema(description = "부모 게시글 ID (답글 등록 시만 필요, 원글이면 생략)", example = "2")
		String parentId
) {
}

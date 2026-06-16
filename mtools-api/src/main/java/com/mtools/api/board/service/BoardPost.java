package com.mtools.api.board.service;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * API 응답용 게시글 DTO.
 * <p>
 * DB {@code t_board} 조회 결과를 JSON으로 내려줄 때 사용한다.
 * {@code record}는 필드 + getter를 자동 생성한다.
 */
@Schema(description = "게시글 응답")
public record BoardPost(
		@Schema(description = "게시글 ID", example = "1")
		String idBoard,
		@Schema(description = "원글 그룹 ID (원글이면 idBoard와 동일)", example = "2")
		String stPid,
		@Schema(description = "계층 정렬값 (#001, #001#001 ...)", example = "#001#001")
		String stOrder,
		@Schema(description = "제목", example = "테스트2-답글1")
		String title,
		@Schema(description = "본문", example = "답글 내용")
		String text,
		@Schema(description = "등록일시")
		String insertedAt,
		@Schema(description = "수정일시 (없으면 null)")
		String updatedAt
) {
}

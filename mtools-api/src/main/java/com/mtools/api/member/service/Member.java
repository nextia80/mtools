package com.mtools.api.member.service;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "회원 응답")
public record Member(
		@Schema(description = "회원 ID", example = "1")
		String idMember,
		@Schema(description = "회원 아이디", example = "nextia80")
		String memberId,
		@Schema(description = "이름", example = "유진석")
		String name,
		@Schema(description = "이메일", example = "user@example.com")
		String email,
		@Schema(description = "권한 레벨 (0=관리자)", example = "1")
		String level,
		@Schema(description = "사용 여부", example = "Y")
		String ynUse,
		@Schema(description = "등록일시")
		String insertedAt,
		@Schema(description = "수정일시")
		String updatedAt
) {
}

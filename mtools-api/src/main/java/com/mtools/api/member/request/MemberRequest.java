package com.mtools.api.member.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "회원 등록/수정 요청")
public record MemberRequest(
		@Schema(description = "회원 아이디", example = "nextia80")
		String memberId,
		@Schema(description = "비밀번호 (수정 시 빈 값이면 유지)", example = "123456")
		String password,
		@Schema(description = "이름", example = "유진석")
		String name,
		@Schema(description = "이메일", example = "user@example.com")
		String email,
		@Schema(description = "권한 레벨", example = "1")
		String level,
		@Schema(description = "사용 여부", example = "Y")
		String ynUse
) {
}

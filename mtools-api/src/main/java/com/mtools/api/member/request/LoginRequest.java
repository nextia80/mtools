package com.mtools.api.member.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "로그인 요청")
public record LoginRequest(
		@Schema(description = "회원 아이디", example = "nextia80")
		String memberId,
		@Schema(description = "비밀번호", example = "123456")
		String password
) {
}

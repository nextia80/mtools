package com.mtools.api.member.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.mtools.api.member.request.LoginRequest;
import com.mtools.api.member.request.MemberRequest;
import com.mtools.api.member.service.Member;
import com.mtools.api.member.service.MemberService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Member", description = "회원 관리 API")
@RestController
public class MemberController {

	private final MemberService memberService;

	public MemberController(MemberService memberService) {
		this.memberService = memberService;
	}

	@Operation(summary = "회원 목록 조회")
	@GetMapping("/api/members")
	public List<Member> members() {
		return memberService.findAll();
	}

	@Operation(summary = "로그인")
	@PostMapping("/api/members/login")
	public Member login(@RequestBody LoginRequest request) {
		try {
			return memberService.login(request.memberId(), request.password());
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, exception.getMessage());
		}
	}

	@Operation(summary = "회원 등록")
	@PostMapping("/api/members")
	public Member createMember(@RequestBody MemberRequest request) {
		try {
			return memberService.create(request);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@Operation(summary = "회원 수정")
	@PutMapping("/api/members/{idMember}")
	public Member updateMember(
			@Parameter(description = "회원 ID", example = "1")
			@PathVariable String idMember,
			@RequestBody MemberRequest request
	) {
		try {
			return memberService.update(idMember, request);
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}

	@Operation(summary = "회원 삭제", description = "yn_use='N' 소프트 삭제")
	@DeleteMapping("/api/members/{idMember}")
	public Map<String, String> deleteMember(
			@Parameter(description = "회원 ID", example = "1")
			@PathVariable String idMember
	) {
		try {
			memberService.delete(idMember);
			return Map.of("status", "ok");
		} catch (IllegalArgumentException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, exception.getMessage());
		}
	}
}

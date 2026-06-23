package com.mtools.api.member.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.mtools.api.member.dao.MemberDao;
import com.mtools.api.member.request.MemberRequest;

@Service
public class MemberService {

	private final MemberDao memberDao;

	public MemberService(MemberDao memberDao) {
		this.memberDao = memberDao;
	}

	public List<Member> findAll() {
		return memberDao.findAll();
	}

	public Member login(String memberId, String password) {
		if (!StringUtils.hasText(memberId) || !StringUtils.hasText(password)) {
			throw new IllegalArgumentException("아이디와 비밀번호를 입력하세요.");
		}

		Member member = memberDao.findByLogin(memberId.trim(), password.trim());

		if (member == null) {
			throw new IllegalArgumentException("로그인 정보가 올바르지 않습니다.");
		}

		return member;
	}

	public Member create(MemberRequest request) {
		validateCreateRequest(request);

		String memberId = request.memberId().trim();

		if (memberDao.findByMemberId(memberId) != null) {
			throw new IllegalArgumentException("이미 사용 중인 아이디입니다: " + memberId);
		}

		String nextId = String.valueOf(memberDao.nextId());
		String level = normalizeLevel(request.level());
		String ynUse = normalizeYnUse(request.ynUse());

		memberDao.insert(
				nextId,
				memberId,
				request.password().trim(),
				trimToNull(request.name()),
				trimToNull(request.email()),
				level,
				ynUse
		);

		return findById(nextId);
	}

	public Member update(String idMember, MemberRequest request) {
		findById(idMember);
		validateUpdateRequest(request);

		String memberId = request.memberId().trim();
		Member existingByLogin = memberDao.findByMemberId(memberId);

		if (existingByLogin != null && !existingByLogin.idMember().equals(idMember)) {
			throw new IllegalArgumentException("이미 사용 중인 아이디입니다: " + memberId);
		}

		String password = StringUtils.hasText(request.password()) ? request.password().trim() : null;

		int updatedRows = memberDao.update(
				idMember,
				memberId,
				password,
				trimToNull(request.name()),
				trimToNull(request.email()),
				normalizeLevel(request.level()),
				normalizeYnUse(request.ynUse())
		);

		if (updatedRows == 0) {
			throw new IllegalArgumentException("수정할 회원을 찾을 수 없습니다: " + idMember);
		}

		return findById(idMember);
	}

	public void delete(String idMember) {
		int deletedRows = memberDao.delete(idMember);

		if (deletedRows == 0) {
			throw new IllegalArgumentException("삭제할 회원을 찾을 수 없습니다: " + idMember);
		}
	}

	private Member findById(String idMember) {
		Member member = memberDao.findById(idMember);

		if (member == null) {
			throw new IllegalArgumentException("회원을 찾을 수 없습니다: " + idMember);
		}

		return member;
	}

	private void validateCreateRequest(MemberRequest request) {
		if (!StringUtils.hasText(request.memberId())) {
			throw new IllegalArgumentException("회원 아이디를 입력하세요.");
		}

		if (!StringUtils.hasText(request.password())) {
			throw new IllegalArgumentException("비밀번호를 입력하세요.");
		}

		if (!StringUtils.hasText(request.name())) {
			throw new IllegalArgumentException("이름을 입력하세요.");
		}
	}

	private void validateUpdateRequest(MemberRequest request) {
		if (!StringUtils.hasText(request.memberId())) {
			throw new IllegalArgumentException("회원 아이디를 입력하세요.");
		}

		if (!StringUtils.hasText(request.name())) {
			throw new IllegalArgumentException("이름을 입력하세요.");
		}
	}

	private String normalizeLevel(String level) {
		if (!StringUtils.hasText(level)) {
			return "99";
		}

		return level.trim();
	}

	private String normalizeYnUse(String ynUse) {
		if (!StringUtils.hasText(ynUse)) {
			return "Y";
		}

		return "Y".equalsIgnoreCase(ynUse.trim()) ? "Y" : "N";
	}

	private String trimToNull(String value) {
		if (!StringUtils.hasText(value)) {
			return null;
		}

		return value.trim();
	}
}

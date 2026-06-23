package com.mtools.api.member.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.mtools.api.member.service.Member;

@Mapper
public interface MemberDao {

	List<Member> findAll();

	Member findById(@Param("idMember") String idMember);

	Member findByMemberId(@Param("memberId") String memberId);

	Member findByLogin(
			@Param("memberId") String memberId,
			@Param("password") String password
	);

	long nextId();

	int insert(
			@Param("idMember") String idMember,
			@Param("memberId") String memberId,
			@Param("password") String password,
			@Param("name") String name,
			@Param("email") String email,
			@Param("level") String level,
			@Param("ynUse") String ynUse
	);

	int update(
			@Param("idMember") String idMember,
			@Param("memberId") String memberId,
			@Param("password") String password,
			@Param("name") String name,
			@Param("email") String email,
			@Param("level") String level,
			@Param("ynUse") String ynUse
	);

	int delete(@Param("idMember") String idMember);
}

package com.mtools.api.calendar.dao;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.mtools.api.calendar.service.GoogleOAuthToken;

@Mapper
public interface GoogleOAuthDao {

	GoogleOAuthToken find();

	int upsert(
			@Param("accessToken") String accessToken,
			@Param("refreshToken") String refreshToken,
			@Param("expiresAt") java.time.LocalDateTime expiresAt,
			@Param("email") String email
	);

	int deleteAll();
}

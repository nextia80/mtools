package com.mtools.api.board.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.mtools.api.board.service.BoardPost;

/**
 * 게시판 DB 접근 인터페이스(Dao).
 * <p>
 * {@code @Mapper} + {@code BoardMapper.xml} 조합으로 MyBatis가 SQL을 실행한다.
 * 이 파일에는 메서드 선언만 있고, 실제 SQL은 XML에 있다.
 */
@Mapper
public interface BoardDao {

	/** 전체 목록 (yn_use != 'N', st_pid DESC / st_order ASC) */
	List<BoardPost> findAll();

	/** ID 단건 조회 */
	BoardPost findById(@Param("idBoard") String idBoard);

	/** 다음 id_board (MAX + 1) */
	long nextId();

	/**
	 * 부모 글의 직계 자식 st_order 목록.
	 * {@code @Param} 이름은 XML의 {@code #{stPid}}, {@code #{parentOrder}} 와 연결된다.
	 */
	List<String> findDirectChildOrders(
			@Param("stPid") String stPid,
			@Param("parentOrder") String parentOrder
	);

	/** INSERT — id_board, st_pid, st_order, 제목, 본문 */
	int insert(
			@Param("idBoard") String idBoard,
			@Param("stPid") String stPid,
			@Param("stOrder") String stOrder,
			@Param("title") String title,
			@Param("text") String text
	);

	/** UPDATE — 제목, 본문 */
	int update(
			@Param("idBoard") String idBoard,
			@Param("title") String title,
			@Param("text") String text
	);

	/** 소프트 DELETE — yn_use = 'N' */
	int delete(@Param("idBoard") String idBoard);
}

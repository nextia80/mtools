package com.mtools.api.board.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.mtools.api.board.dao.BoardDao;
import com.mtools.api.board.request.BoardPostRequest;

/**
 * 게시판 비즈니스 로직(Service).
 * <p>
 * Controller와 Dao 사이에서 원글/답글 규칙, {@code st_order} 계산 등을 처리한다.
 * {@code @Service}로 Spring이 싱글톤 Bean으로 등록한다.
 */
@Service
public class BoardService {

	/** 원글(1Level) 등록 시 사용하는 기본 st_order 값 */
	private static final String ROOT_ORDER = "#001";

	private final BoardDao boardDao;

	public BoardService(BoardDao boardDao) {
		this.boardDao = boardDao;
	}

	/** 전체 게시글 목록 (Dao → MyBatis SQL) */
	public List<BoardPost> findAll() {
		return boardDao.findAll();
	}

	/**
	 * 게시글 등록.
	 * <ul>
	 *   <li>원글: st_pid = id_board, st_order = #001</li>
	 *   <li>답글: st_pid = 원글 그룹 ID, st_order = 부모 order + #001 형식 자동 증가</li>
	 * </ul>
	 */
	public BoardPost create(BoardPostRequest request) {
		String nextId = String.valueOf(boardDao.nextId());

		if (!StringUtils.hasText(request.parentId())) {
			boardDao.insert(nextId, nextId, ROOT_ORDER, request.title(), request.text());
			return findById(nextId);
		}

		BoardPost parent = findById(request.parentId().trim());
		String childOrder = nextChildOrder(parent.stPid(), parent.stOrder());

		boardDao.insert(nextId, parent.stPid(), childOrder, request.title(), request.text());
		return findById(nextId);
	}

	/** 제목·본문 수정 후 갱신된 게시글 반환 */
	public BoardPost update(String idBoard, BoardPostRequest request) {
		int updatedRows = boardDao.update(idBoard, request.title(), request.text());

		if (updatedRows == 0) {
			throw new IllegalArgumentException("수정할 게시글을 찾을 수 없습니다: " + idBoard);
		}

		return findById(idBoard);
	}

	/** 소프트 삭제 (yn_use = 'N') */
	public void delete(String idBoard) {
		int deletedRows = boardDao.delete(idBoard);

		if (deletedRows == 0) {
			throw new IllegalArgumentException("삭제할 게시글을 찾을 수 없습니다: " + idBoard);
		}
	}

	/**
	 * 부모 글 바로 아래 직계 자식의 다음 st_order 계산.
	 * 예: 부모 #001 → 자식 #001#001, #001#002 ...
	 */
	private String nextChildOrder(String stPid, String parentOrder) {
		int maxSegment = boardDao.findDirectChildOrders(stPid, parentOrder).stream()
				.mapToInt(this::lastSegmentNumber)
				.max()
				.orElse(0);

		return parentOrder + String.format("#%03d", maxSegment + 1);
	}

	/** st_order 문자열의 마지막 #001 세그먼트 숫자 추출 */
	private int lastSegmentNumber(String order) {
		int lastHashIndex = order.lastIndexOf('#');

		if (lastHashIndex < 0 || lastHashIndex >= order.length() - 1) {
			return 0;
		}

		return Integer.parseInt(order.substring(lastHashIndex + 1));
	}

	/** ID로 게시글 조회, 없으면 예외 */
	private BoardPost findById(String idBoard) {
		BoardPost post = boardDao.findById(idBoard);

		if (post == null) {
			throw new IllegalArgumentException("게시글을 찾을 수 없습니다: " + idBoard);
		}

		return post;
	}
}

package com.mtools.api.board.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.mtools.api.board.request.BoardPostRequest;
import com.mtools.api.board.service.BoardPost;
import com.mtools.api.board.service.BoardService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 게시판 REST API 창구(Controller).
 * <p>
 * Vue/터미널에서 HTTP 요청을 받아 {@link BoardService}에 위임한다.
 * URL 매핑은 {@code @GetMapping}, {@code @PostMapping} 등으로 연결된다.
 */
@Tag(name = "Board", description = "블로그형 무한 답글 게시판 API")
@RestController
public class BoardController {

	/** 비즈니스 로직을 담당하는 Service (Spring이 생성자로 자동 주입) */
	private final BoardService boardService;

	public BoardController(BoardService boardService) {
		this.boardService = boardService;
	}

	/**
	 * 게시글 전체 목록 조회.
	 * 정렬: {@code ORDER BY st_pid DESC, st_order ASC} (트리 순서 flat 배열)
	 */
	@Operation(summary = "게시글 목록 조회", description = "삭제(yn_use=N) 제외, 트리 정렬 순서로 반환")
	@GetMapping("/api/boards")
	public List<BoardPost> boards() {
		return boardService.findAll();
	}

	/**
	 * 게시글 등록.
	 * {@code parentId} 없으면 원글, 있으면 해당 글의 답글(대댓글 포함).
	 */
	@Operation(summary = "게시글 등록", description = "parentId 생략=원글, parentId=부모 id=답글")
	@PostMapping("/api/boards")
	public BoardPost createBoard(@RequestBody BoardPostRequest request) {
		return boardService.create(request);
	}

	/** 게시글 제목·내용 수정 */
	@Operation(summary = "게시글 수정")
	@PutMapping("/api/boards/{idBoard}")
	public BoardPost updateBoard(
			@Parameter(description = "게시글 ID", example = "1")
			@PathVariable String idBoard,
			@RequestBody BoardPostRequest request
	) {
		return boardService.update(idBoard, request);
	}

	/** 게시글 소프트 삭제 (yn_use = 'N') */
	@Operation(summary = "게시글 삭제", description = "DB 행 삭제가 아닌 yn_use='N' 처리")
	@DeleteMapping("/api/boards/{idBoard}")
	public Map<String, String> deleteBoard(
			@Parameter(description = "게시글 ID", example = "1")
			@PathVariable String idBoard
	) {
		boardService.delete(idBoard);
		return Map.of("status", "ok");
	}
}

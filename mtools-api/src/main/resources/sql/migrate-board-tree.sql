-- 기존 t_board 테이블이 구 스키마일 때 수동 실행
DROP TABLE IF EXISTS t_board;

CREATE TABLE t_board (
	id_board VARCHAR(100) PRIMARY KEY,
	st_pid VARCHAR(100) NOT NULL,
	st_order VARCHAR(10000) NOT NULL,
	st_title VARCHAR(1000),
	tx_board TEXT,
	yn_use VARCHAR(1) DEFAULT 'Y',
	id_insert VARCHAR(100),
	dt_insert TIMESTAMP,
	id_update VARCHAR(100),
	dt_update TIMESTAMP
);

CREATE INDEX idx_t_board_pid_order ON t_board (st_pid, st_order);

CREATE TABLE IF NOT EXISTS tbl_test (
	v01 VARCHAR(100),
	v02 VARCHAR(100),
	v03 VARCHAR(100),
	v04 VARCHAR(100),
	v05 VARCHAR(100),
	v06 VARCHAR(100),
	v07 VARCHAR(100),
	v08 VARCHAR(100),
	v09 VARCHAR(100),
	v10 VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS t_board (
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

CREATE INDEX IF NOT EXISTS idx_t_board_pid_order ON t_board (st_pid, st_order);

CREATE TABLE IF NOT EXISTS t_member (
	id_member NUMERIC(10),
	st_member VARCHAR(100),
	st_name VARCHAR(1000),
	st_email VARCHAR(1000),
	st_level VARCHAR(10) DEFAULT '99',
	yn_use VARCHAR(1),
	id_insert NUMERIC(10),
	dt_insert TIMESTAMP,
	id_update NUMERIC(10),
	dt_update TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_google_oauth (
	id_oauth NUMERIC(10) PRIMARY KEY DEFAULT 1,
	st_access_token TEXT,
	st_refresh_token TEXT,
	dt_expires_at TIMESTAMP,
	st_email VARCHAR(1000),
	dt_updated TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_google_gmail_oauth (
	id_oauth NUMERIC(10) PRIMARY KEY DEFAULT 1,
	st_access_token TEXT,
	st_refresh_token TEXT,
	dt_expires_at TIMESTAMP,
	st_email VARCHAR(1000),
	dt_updated TIMESTAMP
);

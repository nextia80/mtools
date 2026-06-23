INSERT INTO tbl_test (
	v01,
	v02,
	v03,
	v04,
	v05,
	v06,
	v07,
	v08,
	v09,
	v10
)
SELECT
	'1',
	'1',
	'1',
	'1',
	'1',
	'1',
	'1',
	'1',
	'1',
	'1'
WHERE NOT EXISTS (
	SELECT 1 FROM tbl_test
);

INSERT INTO t_member (
	id_member,
	st_member,
	st_password,
	st_name,
	st_level,
	yn_use,
	id_insert,
	dt_insert
)
SELECT
	1,
	'admin',
	'123456',
	'관리자',
	'0',
	'Y',
	1,
	NOW()
WHERE NOT EXISTS (
	SELECT 1 FROM t_member WHERE st_member = 'admin'
);

INSERT INTO t_member (
	id_member,
	st_member,
	st_password,
	st_name,
	st_level,
	yn_use,
	id_insert,
	dt_insert
)
SELECT
	2,
	'nextia80',
	'123456',
	'유진석',
	'1',
	'Y',
	1,
	NOW()
WHERE NOT EXISTS (
	SELECT 1 FROM t_member WHERE st_member = 'nextia80'
);

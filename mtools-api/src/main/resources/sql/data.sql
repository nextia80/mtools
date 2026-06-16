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

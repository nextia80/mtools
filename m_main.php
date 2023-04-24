<script type="text/javascript">
$(document).ready(function() {
	$("#login").click(function() {
		var action = $("#form1").attr('action');
		var form_data = {
			user_id: $("#user_id").val(),
			user_pw: $("#user_pw").val(),
			is_ajax: 1
		};
		$.ajax({
			type: "POST",
			url: action,
			data: form_data,
			success: function(response) {
				if(response == 'success') {
					$("#message").html("<p style='color:green;font-weight:bold'>로그인 성공!</p>");
					$("#form1").slideUp('slow');
				}
				else {
					$("#message").html("<p style='color:red'>아이디 또는 비밀번호가 잘못되었습니다.</p>");	
				}
			}
		});
		return false;
	});
});
</script>

<?PHP
$_body_tag = array("topmargin" => "0", "leftmargin" => "10" );
fn_body($_body_tag);
?>
<h1>MJCT</h1> 
<? echo "접속시간 : ". date("Y-m-d H:i:s")."<br/>"; ?>

<form id="form1" name="form1" action="test_jqueryE.php" method="post">
<table>
<tr>
	<td>아이디</td>
	<td><input type='text' id='user_id' name='user_id' tabindex='1'/></td>
	<td rowspan='2'><input type='button' id='login' tabindex='3' value='로그인' style='height:50px'/></td>
</tr>
<tr>
	<td>비밀번호</td>
	<td><input type='password' id='user_pw' name='user_pw' tabindex='2'/></td>
</tr>
</table>
</form>
<div id="message"></div>

<br>
<br>
DB 설계
<pre>
회원가입
m_mem
  (PK) id_mem 아이디(시쿼스)
  st_mem 아이디(커스텀)
  nm_mem 이름
  yn_use 사용여부
  yn_del 삭제여부
  (FK) id_grp 권한레벨
  id_insert
  dt_insert
  id_update
  dt_update

m_grp
  (PK) id_grp
  nm_grp
  yn_use
  id_insert
  dt_insert
  id_update
  dt_update

m_menu
  (PK) id_memu
  nm_menu
  yn_use1
  id_insert
  dt_insert
  id_update
  dt_update

m_grp_menu
  id_menu
  id_grp
  id_mem
  yn_use
  id_insert
  dt_insert
  id_update
  dt_update
  


  CREATE TABLE member_table (
 seq        INT NOT NULL AUTO_INCREMENT,
 mb_id     VARCHAR(20),
 mb_pw    VARCHAR(20),
 address   VARCHAR(50),
 mb_tell    VARCHAR(50),  
  PRIMARY KEY(seq)
)     



DROP DATABASE IF EXISTS FruitShop;
CREATE DATABASE FruitShop;
USE FruitShop;

CREATE TABLE Units (
UnitId TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
UnitName VARCHAR(10) NOT NULL,
DateEntered DATETIME NOT NULL,
DateUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (UnitId)
)ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE Fruit (
FruitId SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
FruitName VARCHAR(45) NOT NULL, 
Inventory SMALLINT UNSIGNED NOT NULL,
UnitId TINYINT UNSIGNED NOT NULL,
DateEntered DATETIME NOT NULL,
DateUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (FruitId),
CONSTRAINT fkFruitUnits FOREIGN KEY (UnitId) REFERENCES Units (UnitId) ON DELETE RESTRICT ON UPDATE CASCADE
)ENGINE=InnoDB DEFAULT CHARSET=utf8;



mysql>
mysql> CREATE TABLE IF NOT EXISTS fruit
    -> (
    ->   id INT,
    ->   name TEXT,
    ->   color TEXT
    -> );




***
-- 암호화 test 테이블 생성
create table m_encrypt_test
(
    user_id varchar(100)
, password varchar(500)
) comment '암호화테스트' ENGINE=INNODB
;

-- hex(aes_encrypt('암호화 할 문자열','암호화키'))
insert into m_encrypt_test values ('my_account', hex(aes_encrypt('test_password','a')));

commit;

select * from test_job.encrypt_test;

4. 복호화 select 테스트
AES_DECRYPT(unhex(암호화된 값), '암호화키')

select user_id, AES_DECRYPT(unhex(password), 'c') from mtools.encrypt_test;

******
drop table m_mem;
create table m_mem (
    id_mem int PRIMARY KEY AUTO_INCREMENT   COMMENT 'MEM ID'
  , st_mem varchar(30) not null             COMMENT 'MEM 식별 ID'
  , nm_mem varchar(300) not null            COMMENT 'MEM 이름'
  , pw_mem varchar(300) not null            COMMENT '비밀번호'
  , yn_use char(2) default 'Y'              COMMENT '사용여부'
  , yn_del char(2) default 'Y'              COMMENT '삭제여부'
  , id_grp varchar(10)                      COMMENT '그룹ID'
  , id_insert varchar(30)                   COMMENT '입력자'
  , dt_insert DATETIME                      COMMENT '입력시간'
  , id_update varchar(30)                   COMMENT '수정자'
  , dt_update DATETIME                      COMMENT '수정시간'
)
comment 'mTools member table'
ENGINE=INNODB
;
drop table m_grp;
create table m_grp (
    id_grp varchar(30) PRIMARY KEY          COMMENT 'GRP ID'
  , nm_grp varchar(300) not null            COMMENT 'GRP 이름'
  , yn_use char(2) default 'Y'              COMMENT '사용여부'
  , id_insert varchar(30)                   COMMENT '입력자'
  , dt_insert DATETIME                      COMMENT '입력시간'
  , id_update varchar(30)                   COMMENT '수정자'
  , dt_update DATETIME                      COMMENT '수정시간'
)
comment 'mTools group table'
ENGINE=INNODB
;

drop table m_menu;
create table m_menu (
    id_menu varchar(30) PRIMARY KEY         COMMENT 'GRP ID'
  , nm_menu varchar(300) not null           COMMENT 'GRP 이름'
  , id_parent_menu varchar(30)              COMMENT '부모 GRP ID'
  , st_lvl         varchar(10)              COMMENT 'menu levle'
  , st_ord         varchar(255)             COMMENT 'memu order'
  , yn_use char(2) default 'Y'              COMMENT '사용여부'
  , id_insert varchar(30)                   COMMENT '입력자'
  , dt_insert DATETIME                      COMMENT '입력시간'
  , id_update varchar(30)                   COMMENT '수정자'
  , dt_update DATETIME                      COMMENT '수정시간'
)
comment 'mTools menu table'
ENGINE=INNODB
;

m_grp_menu
  id_menu
  id_grp
  id_mem
  yn_use
  id_insert
  dt_insert
  id_update
  dt_update



</pre>
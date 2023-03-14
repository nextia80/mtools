<?PHP
echo "1111";
?>
<html>
<head>
	<title>welcom to mongjoong web api</title>
</head>
<body>
	MJCT Web api
	<br>
	
	database 생성
	
<pre>
>
show databases;
	
CREATE DATABASE DS_MTOOLS default CHARACTER SET UTF8;
SHOW DATABAS # > #은 mysql에서 주석 입니다.
출처: https://futurists.tistory.com/11 [미래학자]
--

GRANT ALL PRIVILEGES ON DS_MTOOLS.* TO root@localhost IDENTIFIED BY 'study'; 
EXIT; 
mysql -u study_user -p USE study_db;

출처: https://futurists.tistory.com/11 [미래학자]



CREATE TABLE professor ( _id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(32) NOT NULL
, belong VARCHAR(12) DEFAULT 'FOO', phone VARCHAR(12) ) ENGINE=INNODB; DESCRIBE professor;

출처: https://futurists.tistory.com/11 [미래학자]


show tables;

desc professor


INSERT INTO professor (name, belong, phone) VALUES('유재석', 'IDE','01112345678'); INSERT INTO professor (name, belong, phone) VALUES('황영조', 'MSE', '01121342443'); INSERT INTO professor (name, belong, phone) VALUES('케이멀', 'ESE', '01123424343'); INSERT INTO professor (_id, name, belong, phone) VALUES(256, '호날두', 'IME', '01134343222'); INSERT INTO professor (name, belong, phone) VALUES( '리오넬', 'IDE', '01123432432'); SELECT _id, belong, phone FROM professor; SELECT * FROM professor;

--
sudo add-apt-repository ppa:ondrej/php
sudo apt-get update
sudo apt-get install php7.3-mysql


--
</pre>	
<hr>
<?php
echo "MySql 연결 테스트";
echo"<br>1.변수값 세팅 완료<br>";
//$host = '15.164.99.173:53846';
$host = 'localhost';
$user = 'root';
$pw = 'since2020';
$dbName = 'DS_MTOOLS';

echo"<br>2.변수값 세팅 완료<br>";
$mysqli = new mysqli($host, $user, $pw, $dbName);
echo"<br>3.호출성공<br>";
    if($mysqli){
        echo "MySQL 접속 성공";
    }else{
        echo "MySQL 접속 실패";
    }
echo"33<br>";

?>
</body>
</html>
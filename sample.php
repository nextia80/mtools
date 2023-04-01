<?PHP
/**
	@class  : index.php
	@doc	: index file
	@auther : mongE
	@version : 1.0, 2023.03.14, create
*/
#include "./inc/dbconn.inc"; # 디비정보
#include "./inc/siteinfo.inc"; # 기본세팅
#include "./inc/fn_html.php"; # 공통 html funciton
include "./inc/mtoolsApi.php";
?>
<?=fn_html_header()?>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?=$_title?></title>
</head>
<body>
    <h1>welcom to mTools</h1>
    <br>
    <br>아파치 서버 설정 
    <br>/opt/homebrew/etc/httpd/httpd.conf
    <br>PHP ini : /opt/homebrew/etc/php/8.2/php.ini
    <br>

 <pre>
CREATE DATABASE mtools default CHARACTER SET UTF8; 
SHOW DATABASES; # > #은 mysql에서 주석 입니다.


CREATE TABLE m_test
(
     id_test INT PRIMARY KEY AUTO_INCREMENT,
     nm_test VARCHAR(32) 
) ENGINE=INNODB;



INSERT INTO m_test (nm_test) VALUES('test1');
INSERT INTO m_test (nm_test) VALUES('test2');
INSERT INTO m_test (nm_test) VALUES('테스트3');
</pre>


<?php
$servername = "localhost";
$username = "root";
$password = "since2020";
$dbname = "mtools";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
mysqli_set_charset($conn, 'utf8'); 

$sql = "select * from m_test";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
echo "<table border=1>";
echo "<tr>";
echo "<td>id</td>";
echo "<td>nm</td>";
echo "</tr>";
    // output data of each row
    while($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row["id_test"]."</td>";
        echo "<td>" . $row["nm_test"]."</td>";
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "0 results";
}
$conn->close();
?>
</body>
</html>
<?php

# DB info
$host = 'localhost';
$user = 'root';
$pw = 'since2020';
$dbName = 'DS_MTOOLS';

$dbconn = new mysqli($host, $user, $pw, $dbName);
if(!$dbconn){
	echo "MySQL 접속 실패";
}
?>
<?php
	$host_name="localhost";
	$db_user_id="root";
	$db_name="since2020";
	$db_pw="DS_MTOOLS";
	function dbconn() {
		header('Content-Type: text/html; charset=utf-8');
		$conn = mysqli_connect($host_name,$db_user_id,$db_pw, $db_name);//mysql연결

		if($conn->connect_errno){
			die('connect error : '.$conn->connect_error);
		}
		return $conn; //호출한 페이지 종료 후 호출한 페이지로 넘어감
	}

/*
$servername = "localhost";
$username = "root";
$password = "since2020";
$dbname = "DS_MTOOLS";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
mysqli_set_charset($conn, 'utf8'); 
*/
?>
<?php

	$host_name="localhost";
	$db_user_id="root";
	$db_name="since2020";
	$db_pw="DS_MTOOLS";
	function dbconn() {
		
		$conn = mysqli_connect($host_name,$db_user_id,$db_pw, $db_name);//mysql연결

		if($conn->connect_errno){
			die('connect error : '.$conn->connect_error);
		}
		return $conn; //호출한 페이지 종료 후 호출한 페이지로 넘어감
	}
?>
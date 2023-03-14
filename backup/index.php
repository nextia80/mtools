<?PHP
	$passURL = "https://mtools.run.goorm.io/";
?>
<html>	
<head>
	<title>welcom to mongjoong web api :)</title>
	<script type="text/javascript" src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
	<script langeage="JAVASCRIPT">
	function init(){
		// alert("site start");
	}
	function textarea_submit() {
		var f = document.f;
		alert(f.a.value);
	}
	</script>
	
</head>

<body onLoad="init()">
<form name="f" method="post">
	<br> <a href='<?=$passURL?>mtools/mboard/mboard_main.php'>mTools>boards</a>
	<br> <a href='<?=$passURL?>mtools/mboard/ex/index.php'>mTools>ex</a>
	<br> <a href='<?=$passURL?>sample/002/index.php'>jQuery Sampel</a>
	<br> <a href='<?=$passURL?>sample/002/testE.php'> ㄴ php exe sampel</a>
	
	
	<br>
	<br>
	<h1>welcom to mongjoong web api</h1>
	<hr>
	<textarea name="a" id="b" cols="100" rows="5">site test</textarea>
	<input type="button" value="Submit" onclick="textarea_submit()">
	
	Hello mongjoong web api site
	<br>가나다라11
	<br>
<?PHP
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

$sql = "select * from M_BOARD_1_0";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        echo "<br>name: " . $row["ID_M_BOARD"];
    }
} else {
    echo "0 results";
}
$conn->close();
	
?>
	
	<?php
	$data_test1 = "#공지사항 #개발일지 #개발일지2 #개발일지3";
	preg_match_all("/\\#([0-9a-zA-Z가-힣]*)/", $data_test1, $hashtags);
			
			
			
// $data = "가나다 #다라마 ABC #QWE 오오오오오오오오 #MINTSTATE  #ㅊㅊㅊㅊ BBS #유진석#테스트 유진석2#테스트2";
// preg_match_all("/\\#([0-9a-zA-Z가-힣]*)/", $data, $hashtags);
print_r($hashtags);
?>
	
	
</form>	
</body>
</html>
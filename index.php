<?PHP
/**
	@class  : index.php
	@doc	: index file
	@auther : mongE
	@version : 1.0, 2023.03.14, create
*/
include "./inc/dbconn.inc"; # setting
?>
<meta http-equiv=Content-Type content=text/html; charset=EUC-KR>
<html>
<head>
	<title>welcom to mTools Api Web site</title>
</head>
<body>

	<h1>
		mTools Api Web site
	</h1>
	<h2>
		: 한글 테스트 : 가나다라마
	</h2>
	<br>
<?PHP


// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
mysqli_set_charset($conn, 'utf8'); 

$sql = "select * from M_BOARD_1_0";
$sql = "select * from test_db";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        // echo "<br>name: " . $row["ID_M_BOARD"];
		echo "<br>name: " . $row["name"];
		
    }
} else {
    echo "0 results";
}
$conn->close();
?>
</body>
</html>
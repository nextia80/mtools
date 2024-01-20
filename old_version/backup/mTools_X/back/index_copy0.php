<meta http-equiv=Content-Type content=text/html; charset=EUC-KR>
<?PHP
	/**
	* mTools main page
	*/
	include "./inc/dbconn.php"; // db관련 페이지
?>
<html>
<head>
	<title>welcom to mTools web api</title>
</head>
<body>

	Hello mongjoong web api site
	<br>가나다라1111
	<br>
<?PHP
$conn = dbconn();
echo $conn;
mysqli_set_charset($conn, 'utf8'); 

	echo "<br>2";
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
</body>
</html>
<meta http-equiv=Content-Type content=text/html; charset=EUC-KR>
<?PHP
#include "./com/dbconn.php";
?>
<html>
<head>
	<title>welcom to mongjoong web api</title>
</head>
<body>

	Hello mongjoong web api site
	<br>가나다라
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
</body>
</html>
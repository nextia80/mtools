<?php
function han ($s) { return reset(json_decode('{"s":"'.$s.'"}')); } 
function to_han ($str) { return preg_replace('/(\\\u[a-f0-9]+)+/e','han("$0")',$str); } 



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

$sql = "SELECT _id, name, belong, phone FROM test_db";
$result = $conn->query($sql);

//json을 php에서 사용하기 위해 필요한 구문
header("Content-Type: application/json");

$db__id = array();
$db_name = array();
$db_belong = array();
$db_phone = array();
echo "\n";
if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
		array_push($db_name, $row["name"]);
		array_push($db__id, $row["_id"]);
		array_push($db_belong, $row["belong"]);
		array_push($db_phone, $row["phone"]);
    }
} else {
    echo "0 results";
}
echo json_encode(array("_id" => $db__id, "name" => $db_name, "belong" => $db_belong, "phone" => $db_phone),JSON_UNESCAPED_UNICODE);
mysqli_close($conn);
?> 

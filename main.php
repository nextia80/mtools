<?php
/**
 * @class : main.php
 */


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


11
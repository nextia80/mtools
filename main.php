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


##### ------

$con=mysqli_connect($servername, $username, $password, $dbname);

if (mysqli_connect_errno()) {
  echo "Failed to connect to MySQL: " . mysqli_connect_error();
  exit;
}

// Return name of current default database
if ($result = mysqli_query($con, "SELECT DATABASE()")) {
  $row = mysqli_fetch_row($result);
  echo "Default database is " . $row[0];
  mysqli_free_result($result);
}

// Change db to "test" db
mysqli_select_db($con, "test");

// Return name of current default database
if ($result = mysqli_query($con, "SELECT DATABASE()")) {
  $row = mysqli_fetch_row($result);
  echo "Default database is " . $row[0];
  mysqli_free_result($result);
}

// Close connection
mysqli_close($con);

?>


11
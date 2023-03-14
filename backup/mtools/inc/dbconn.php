<?php

$_db_servername = "localhost";
$_db_conn_id = "root";
$_db_conn_pw = "since2020";
$_db_dbname = "mtools";

// Create connection
$conn = new mysqli($_db_servername, $_db_conn_id, $_db_conn_pw, $_db_dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
mysqli_set_charset($conn, 'utf8');

#echo "code[since2020]-{[ed_id:IIZS12356]}";
?>
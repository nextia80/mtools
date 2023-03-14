<?php
    header('Content-Type: text/html; charset=utf-8');
    
	$dsn = "mysql:host=localhost;dbname=mtools";
    $username = "root";
    $password = "since2020";

	$pdo = new PDO($dsn, $username, $password);
	$rows = array();

    $stmt = $pdo->prepare("select name from test_db");
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows);
?>
<?php
	$conn = mysqli_connect("localhost", "root", "since2020", "mtools");
	$delete_id = $_POST['delete_id'];
	$sql = "DELETE from test_table WHERE id = '$delete_id';";
	$result = mysqli_query($conn,$sql);
	if($result==false){
		echo mysqli_error($conn);
	}
	echo("<script>location.replace('index.php');</script>");
?>
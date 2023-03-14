<html>
<head>
	<title>Simple Notification</title>
</head>
<body>
	<script language='javascript'>
  	window.setTimeout('window.location.reload()',10000);
	</script>
	<h1 align="center">Notification</h1>
	<form align="center" action="post_notification.php">
		<input type="submit" value="New Notification">
	</form>
	<?php
	$conn = mysqli_connect("localhost", "test", "111111", "sqltest");
	$sql = "SELECT * FROM test_table";
	$rs = mysqli_query($conn,$sql);
	echo "<table border='0' align='center'><tr align='center'><th colspan='5'></th></tr><tr><th>Date</th><th width='400'>Title</th><th>User</th><th>Delete?</th></tr>";
	while($info=mysqli_fetch_array($rs)){
		$delete = '
			<form action="delete.php" method="POST">
				<input type="hidden" name="delete_id" value="'.$info['id'].'">
				<input type="submit" value="Delete">
			</form>
		';
		echo "<tr><td>".$info['date']."</td><td align='center'>"
			."<a href='description.php?id=$info[id]'>"
			.$info['title']."</a></td><td>".$info['user']
			."</td><td>"
			.$delete
			."</td></tr>";
	}
	echo "</table>";
	?>
</body>
</html>
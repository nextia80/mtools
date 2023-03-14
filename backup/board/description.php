<html>
<head>
	<title>Simple Notification</title>
</head>
<body>
	<form action="index.php">
		<input type="submit" value="BACK">
	</form>
	<?php
		$conn = mysqli_connect("localhost", "root", "since2020", "mtools");
		$sql = "SELECT * FROM test_table WHERE id=$_GET[id]";
		$rs = mysqli_query($conn,$sql);
		$info = mysqli_fetch_array($rs);
		$description_fix = nl2br($info[description]);
		echo "<table border='1'><tr><th>Date</th><td>$info[date]</td></tr><tr><th>Title</th><td>$info[title]</td></tr><tr><th>User</th><td>$info[user]</td></tr>";
		echo "<tr><td colspan='2'>$description_fix></tr></table>"
	?>
</body>
</html>
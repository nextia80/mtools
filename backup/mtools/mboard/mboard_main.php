<?PHP
include "../inc/mtools_com_fn.php";
include "../inc/dbconn.php";

/*
$sql = "select * from test_db";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        echo "<br>name: " . $row["name"];
    }
} else {
    echo "0 results";
}
$conn->close();
*/
?>

<!--DOCTYPE html>
<html>
<head>
	<meta charset="utf-8" />
	<title>mTools > mboard 1.0</title>
	<link rel="stylesheet" href="./css/normalize.css" />
	<link rel="stylesheet" href="./css/board.css" />
</head>
<body>
	<article class="boardArticle">
		<h3>mBoard 1.0</h3>
		<div id="boardList">
			<table>
				<caption class="readHide">mBoard</caption>
				<thead>
					<tr>
						<th scope="col" class="no">번호</th>
						<th scope="col" class="title">제목</th>
						<th scope="col" class="author">작성자</th>
						<th scope="col" class="date">작성일</th>
						<th scope="col" class="hit">조회</th>
					</tr>
				</thead>
			</table>
			<div class="btnSet">
				<a href="./write.php" class="btnWrite btn">글쓰기</a>
			</div>
		</div>
	</article>
</body>
</html>
-->

<!doctype html>
<html lang="ko">
	<head>
		<meta charset="utf-8">
		<title>jQuery</title>
		<script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
		<script>
			$( document ).ready( function() {
				$( '#jb' ).css( 'color', 'red' );
			} );
		</script>
	</head>
	<body>
		<h1 id="jb">Lorem Ipsum Dolor</h1>
	</body>
</html>
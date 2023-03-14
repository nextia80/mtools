<?PHP
/**
	@class  : index.php
	@doc	: index file
	@auther : mongE
	@version : 1.0, 2023.03.14, create
*/
include "./inc/dbconn.inc"; # 디비정보
include "./inc/siteinfo.inc"; # 기본세팅
?>
<meta http-equiv=Content-Type content=text/html; charset=EUC-KR>
<html>
<head>
	<title><?=$_title?></title>
</head>
<body>

	<h1>
		mTools Api Web site - mtools
	</h1>
	<h2>
		: 한글 테스트 : 가나다라마 
	</h2>
	<br>
	DB TEST --> 2

<br>https://velog.io/@simchodi/Git-%EC%B4%88%EA%B8%B0%EC%84%B8%ED%8C%85-%EA%B8%B0%EB%B3%B8%EB%AA%85%EB%A0%81%EC%96%B4
<br>
<br>1) 윈도우와 맥의 엔터방식 차이로 인한 오류 방지
<br>git config --global core.autocrlf true 
<pre>
2) 사용자 이름, 이메일 주소 설정

git config --global user.name "(본인 이름)"
git config --global user.email "(본인 이메일)"
3) 사용자 이름, 이메일 주소 설정 확인

git config --global user.name
git config --global user.email
4) 브랜치명 master > main으로 변경
(master는 노예제도를 연상시킨다고 하여 main으로 사용함)

git config --global init.defaultBranch main
5) Git 저장소 생성
(저장소를 만들 폴더로 이동 후 하는 것이 좋음. 현재 디렉토리를 기준으로 저장소가 생성됨)

git init

</pre>
<br>git config --global user.name "nextia80"
<br>git config --global user.email "nextia80@gmail.com"

<?PHP


// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);
// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
mysqli_set_charset($conn, 'utf8'); 

$sql = "select * from M_BOARD_1_0";
$sql = "select * from test_db";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        // echo "<br>name: " . $row["ID_M_BOARD"];
		echo "<br>name: " . $row["name"];
		
    }
} else {
    echo "0 results";
}
$conn->close();
?>
</body>
</html>
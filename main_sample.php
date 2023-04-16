<?php

    /** markdown ************************************************************************/
    /*
    markdown Ex
    spl_autoload_register(function($class){
        require str_replace('\\', DIRECTORY_SEPARATOR, ltrim($class, '\\')).'.php';
    });
    use Michelf\Markdown;
    */    
    //$text = file_get_contents('README.md');
    //$html = Markdown::defaultTransform($text);
    //echo  $html;
    /** markdown ************************************************************************/
    
    $_body_tag = array("topmargin" => "0", "leftmargin" => "0" );
    fn_body($_body_tag);


# mysql db select sample
  #* mysqli_fetch_array / fetch_assoc 차이점을 찾아서 정리해보자
	$sql = "select * from m_test";
	$result = fn_run($conn, $sql);

	if ($result->num_rows > 0) {
		echo "<table border=1>";
		echo "<tr>";
		echo "<td>id</td>";
		echo "<td>nm</td>";
		echo "</tr>";

		while($row = $result->fetch_assoc()) {
			echo "<tr>";
			echo "<td>" . $row["id_test"]."</td>";
			echo "<td>" . $row["nm_test"]."</td>";
			echo "</tr>";
		}
		echo "</table>";
	}
	else {
		echo "0 results";
	}

#-------------------------------------------------------------------------------------------------------
# mysql db table is exist
echo "<hr>";
echo fn_is_table($conn, "m_test"); // Table이 존재하는지 확인

#-------------------------------------------------------------------------------------------------------
# Table Create And Drop 함수 만들기
echo "<hr>";

# 테이블이 존재하면 제거한다.
if(fn_is_table($conn, "m_test2")){
	fn_run($conn, "drop table m_test2");
}

# Create SQL
$sql = "
	CREATE TABLE m_test2
	(
		id_test INT PRIMARY KEY AUTO_INCREMENT
		, nm_test VARCHAR(32)
	) ENGINE=INNODB;
";
if( fn_run($conn, $sql) ) {
	echo "<br>create table 3";
} else {
	echo "<br>error table 3";
}


$sql  = " INSERT INTO m_test2 (nm_test) VALUES('test1'),('test2'),('test3');";
fn_run($conn, $sql);


$sql = "select * from m_test2";
$result = fn_run($conn, $sql);

if ($result->num_rows > 0) {
	echo "<table border=1>";
	echo "<tr>";
	echo "<td>id</td>";
	echo "<td>nm</td>";
	echo "</tr>";

	while($row = $result->fetch_assoc()) {
		echo "<tr>";
		echo "<td>" . $row["id_test"]."</td>";
		echo "<td>" . $row["nm_test"]."</td>";
		echo "</tr>";
	}
	echo "</table>";
}
else {
	echo "0 results";
}


# 쿠키 
#-- 쿠키는 좀 더 신중하게 생각해보자!!
/*
$cookieName = "city";
$cookieValue = "서울";

if(!isset($_COOKIE[$cookieName])) { // 해당 쿠키가 존재하지 않을 때
	echo "{$cookieName}라는 이름의 쿠키는 아직 생성되지 않았습니다.";
} else {                            // 해당 쿠키가 존재할 때
	echo "{$cookieName}라는 이름의 쿠키가 생성되었으며, 생성된 값은 '".$_COOKIE[$cookieName]."'입니다.";
}
*/

?>
11
test
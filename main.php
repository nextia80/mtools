<?php    /** markdown ************************************************************************/
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
    fn_html_body($_body_tag);


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
/*
		while ($row = mysqli_fetch_array($result)){
			print_r($row);
			echo '<br>';
		}
*/
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

if(fn_is_table($conn, "m_test2")){
	fn_run($conn, "drop table m_test2");
}
/*
$sql = "";
$sql .= "CREATE TABLE m_test2";
$sql .= "(";
$sql .= "       id_test INT PRIMARY KEY AUTO_INCREMENT";
$sql .= "	 , nm_test VARCHAR(32) ";
$sql .= ") ENGINE=INNODB;";
*/
$sql = "
CREATE TABLE m_test2
(
       id_test INT PRIMARY KEY AUTO_INCREMENT
	 , nm_test VARCHAR(32)
) ENGINE=INNODB;
";

$result = fn_run($conn, $sql);
if (fn_is_table($conn, "m_test2")) {
	echo "<br>create table2";
} else {
	echo "<br>error table2";
}


$sql = "INSERT INTO m_test2 (nm_test) VALUES('test1')";
fn_run($conn, $sql);


#INSERT INTO m_test (nm_test) VALUES('test1');




	#div sampel
	#include "./sample/div_table.php";
	#include "./sample/div_table02.php";
	#include "./sample/div_table03.php";
?>
end page
 
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

   /*
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
	*/
# mysql db select function sample
echo "<hr>";	


echo "<hr>";
# mysql db table is exist
	echo fn_is_table($conn, "m_test"); // Table이 존재하는지 확인

	#div sampel
	#include "./sample/div_table.php";
	#include "./sample/div_table02.php";
	#include "./sample/div_table03.php";
?>
1
 
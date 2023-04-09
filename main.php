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
$sql = "select * from m_test";
	$result = $conn->query($sql);

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
# mysql db select function sample
echo "<hr>";	
	$sql = "select * from m_test";
	fm_select($conn, $sql);

echo "<hr>";
# mysql db table is exist
	echo fm_isTable($conn, "m_test"); // Table이 존재하는지 확인

	#div sampel
	#include "./sample/div_table.php";
	#include "./sample/div_table02.php";
	#include "./sample/div_table03.php";
?>
1
 
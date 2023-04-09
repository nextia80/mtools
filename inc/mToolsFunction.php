<?php
/**
	@class  : fn_function.php
	@doc	: tag function collaction
	@auther : mongE
	@version : 1.0, 2023.03.22, create
*/

/**
 * @class 	: fn_mTag_enter
 * @doc		: 개행문자 `\n`을 화면에 출력한다.
 * @auther	: mongE
 * @version	: 1.0, 2023.04.03, create
 */
function fn_mTag_enter() {
	echo "\n";
}
	
/**
 * @class 	: fn_mTag_br
 * @doc		: tag br을 화면에 출력한다.
 * @auther	: mongE
 * @version	: 1.0, 2023.04.03, create
 */
function fn_mTag_br() {
	echo fn_mTag_enter() . "<br>";
}


/**
 * @class : fn_html_header
 * @doc   : header code print
 * @auther : mongE
 * @version : 1.0, 2023.03.18, create
 */
function fn_html_header($_title){
    echo "<!DOCTYPE html>";
	echo fn_mTag_enter()."<html>";
	echo fn_mTag_enter()."<head>";
	echo fn_mTag_enter()."	<title>" . $_title ."</title>";
	echo fn_mTag_enter()."</head>";

}

/**
 * @class : fn_html_body
 * @doc   : body code print
 * @auther : mongE
 * @version : 1.0, 2023.4.4, create
 */
function fn_html_body($_body_tag){
	extract($_body_tag);

    echo fn_mTag_enter()."<body";
	if(isset($topmargin)) {
		echo " topmarin=".$topmargin;
	}
	if(isset($leftmargin)) {
		echo " leftmargin=".$leftmargin;
	}
	echo ">";
	fn_mTag_enter();
}

/**
 * @class : fn_html_body
 * @doc   : body code print
 * @auther : mongE
 * @version : 1.0, 2023.4.4, create
 */
function fn_html_footer(){
    echo fn_mTag_enter()."</body>";
	echo fn_mTag_enter()."</html>";
}

/**
 * @calss	: fn_m_markdown
 * @doc		: 파일을 마크다운으로 변경해준다.
 * @auther	: mongE
 * @version	1.0, 2023.4.6, mongE, create
 */
function fn_m_markdown($text){
	//$html = Markdown::defaultTransform($text);
	//return $html;
}

/**
 * @class	: fm_isTable
 * @doc		: 해당 테이블이 있는지 확인한다.
 * @auther	: mongE
 * @version 1.0, 2023.4.9, mongE, create
 */
function fm_isTable($conn, $tablename) {
	$sql = "SHOW TABLES LIKE '" . $tablename . "';";
	$result = $conn->query($sql);
	if ($result->num_rows > 0) {
		return true;
	} else {
		return false;
	}
}

function fm_select($conn, $sql) {
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
}
?>
<?php
/**
	@class  : fn_function.php
	@doc	: tag function collaction
	@auther : mongE
	@version : 1.0, 2023.03.22, create
*/

/**
 * @class 	: fn_enter
 * @doc		: 개행문자 `\n`을 화면에 출력한다.
 * @auther	: mongE
 * @version	: 1.0, 2023.04.03, create
 *            1.1, 2023.04.13, modify
 *               - 함수명 변경 : fn_mTag_enter -> fn_enter
 */
function fn_enter() {
	echo "\n";
}
	
/**
 * @class 	: fn_br
 * @doc		: tag br을 화면에 출력한다.
 * @auther	: mongE
 * @version	: 1.0, 2023.04.03, create
 *            1.1, 2023.04.13, modify
 *            - 함수명 변경 : fn_mTag_br -> fn_br
 */
function fn_br() {
	echo fn_enter() . "<br>";
}


/**
 * @class : fn_header
 * @doc   : header code print
 * @auther : mongE
 * @version : 1.0, 2023.03.18, create
 *            1.1, 2023.03.13, modify
 *            - 함수명 변경 : fn_header
 */
function fn_header($_title){
    echo "<!DOCTYPE html>";
	echo fn_enter()."<html>";
	echo fn_enter()."<head>";
	echo fn_enter()."	<title>" . $_title ."</title>";
	echo fn_enter()."</head>";

}

/**
 * @class : fn_body
 * @doc   : body code print
 * @auther : mongE
 * @version : 1.0, 2023.04.04, create
 *            1.1, 2023.04.13, modify
 *            - 함수명 변경 : fn_html_body -> fn_body
 */
function fn_body($_body_tag){
	extract($_body_tag);

    echo fn_enter()."<body";
	if(isset($topmargin)) {
		echo " topmarin=".$topmargin;
	}
	if(isset($leftmargin)) {
		echo " leftmargin=".$leftmargin;
	}
	echo ">";
	fn_enter();
}

/**
 * @class : fn_footer
 * @doc   : footer code print
 * @auther : mongE
 * @version : 1.0, 2023.04.04, create
 *            1.1, 2023.04.13, modify
 *            - 함수명 변경 : fn_html_footer -> fn_footer
 */
function fn_footer(){
    echo fn_enter()."</body>";
	echo fn_enter()."</html>";
}

/**
 * @class	: fn_is_table
 * @doc		: 해당 테이블이 있는지 확인한다.
 * @auther	: mongE
 * @version 1.0, 2023.4.9, mongE, create
 */
function fn_is_table($conn, $tablename) {
	$sql = "SHOW TABLES LIKE '" . $tablename . "';";
	$result = $conn->query($sql);
	if ($result->num_rows > 0) {
		return true;
	} else {
		return false;
	}
}

/**
 * @class	: fn_run
 * @doc		: 쿼리 실행한 값을 가져온다.
 * @auther	: mongE
 * @version 1.0, 2023.4.10, mongE, create
 */
function fn_run($conn, $sql) {
	return $conn->query($sql);
}

/**
 * @class	: fn_get_run
 * @doc		: 쿼리 실행한후 결과값의 메세제를 출력한다.
 * @auther	: mongE
 * @version 1.0, 2023.4.13, mongE, create
 */
function fn_get_run($conn, $sql) {
	return $conn->query($sql);
}

?>
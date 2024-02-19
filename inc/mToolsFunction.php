<?php
/**
	@class  : fn_function.php
	@doc	: tag function collection
	@author : mongE
	@version : 1.0, 2023.03.22, create
*/

/**
 * @class   : fn_close_dbconn
 * @doc     : DB connect off function
 * @author    : mongE
 * @version 1.0, 2023.12.31, mongE, create
 */
function fn_start_dbconn($servername, $username, $password, $dbname){
    $conn = new mysqli($servername, $username, $password, $dbname); // Create connection
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    return $conn;
}

/**
 * @class   : fn_close_dbconn
 * @doc     : DB connect off function
 * @author    : mongE
 * @version 1.0, 2023.12.31, mongE, create
 */
function fn_close_dbconn($conn){
    $conn->close(); // DB connect off code
}

/**
 * @class 	: fn_enter
 * @doc		: 개행문자 `\n`을 화면에 출력한다.
 * @author	: mongE
 * @version	: 1.0, 2023.04.03, create
 *            1.1, 2023.04.13, modify
 *               - 함수명 변경 : fn_mTag_enter -> fn_enter
 */
function fn_newLine() {
    echo "\n";
}

/**
 * @class   : fn_echo
 * @doc     : new line add echo function
 * @author  : mongE
 * @version 1.0, 2024.1.1, mongE, create
 */
function fn_echo($code) {
    echo fn_newLine().$code;
}

/**
 * @class 	: fn_br
 * @doc		: tag br을 화면에 출력한다.
 * @author	: mongE
 * @version	: 1.0, 2023.04.03, create
 *            1.1, 2023.04.13, modify
 *            - 함수명 변경 : fn_mTag_br -> fn_br
 */
function fn_br() {
	echo fn_newLine() . "<br>";
}

/**
 * @class : fn_header
 * @doc   : header code print
 * @author : mongE
 * @version : 1.0, 2023.03.18, create
 *            1.1, 2023.03.13, modify
 *            - 함수명 변경 : fn_header
 */
function fn_header($_title){
    echo "<!DOCTYPE html>";
	echo fn_newLine()."<html>";
	echo fn_newLine()."<head>";
	echo fn_newLine()."    <title>" . $_title ."</title>";
	echo fn_newLine()."</head>";
	echo fn_newLine()."<script src='./inc/jquery-3.6.4.js'></script>";
	echo fn_newLine()."<link href='./inc/mtools.css' rel='stylesheet' type='text/css'>";
}
/**
 * @class : fn_body
 * @doc   : body code print
 * @author : mongE
 * @version : 1.0, 2023.04.04, create
 *            1.1, 2023.04.13, modify
 *            - 함수명 변경 : fn_html_body -> fn_body
 */
function fn_body($_body_tag){
	extract($_body_tag);

    echo fn_newLine()."<body";
	if(isset($topmargin)) {
		echo " topmarin=".$topmargin;
	}
	if(isset($leftmargin)) {
		echo " leftmargin=".$leftmargin;
	}
	echo ">";
	fn_newLine();
}

/**
 * @class : fn_footer
 * @doc   : footer code print
 * @author : mongE
 * @version : 1.0, 2023.04.04, create
 *            1.1, 2023.04.13, modify
 *            - 함수명 변경 : fn_html_footer -> fn_footer
 */
function fn_footer(){
    echo fn_newLine()."</body>";
	echo fn_newLine()."</html>";
}

/**
 * @class	: fn_is_table
 * @doc		: 해당 테이블이 있는지 확인한다.
 * @author	: mongE
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
 * @author	: mongE
 * @version 1.0, 2023.4.10, mongE, create
 */
function fn_run($conn, $sql) {
	return $conn->query($sql);
}


/**
 * @class	: fn_runs
 * @doc		: 쿼리 실행한 값을 가져온다.
 * @author	: mongE
 * @version 1.0, 2024.1.1, mongE, create
 */
function fn_runs($conn, $json_d) {
    $d = json_decode($json_d, true);

    // LOG 출력 여부를 체크한다.
    $yn_log = "N";
    if(isset($d['logYn'])) {
        $yn_log = $d['logYn'];
    }

    // SQL 구문을 체크한다.
    $sql = "ERR";
    if(isset($d['sql'])) {
        $sql = $d['sql'];
    }

    // SQL 구문이 오류일 경우 에러 메세지를 출력한다.
    if($sql == "ERR") {
        fn_show_error_info($conn, "ERR_DB_00001");
        return false;
    }

    // LOG 출력 여부가 'Y'인경우 로그를 출력한다.
    if($yn_log == "Y") echo fn_newLine()."[fn_runs] LOG> " . $sql . fn_br();
    return $conn->query($sql);
}

/**
 * @class	: fn_get_error_text
 * @doc		: error code에 해당하는 값을 출력한다.
 * @author	: mongE
 * @version 1.0, 2024.1.1, mongE, create
 */
function fn_show_error_info($conn, $st_error) {
    $sql = "select st_error, tx_error from m_error where yn_use = 'Y' AND st_error = '${st_error}' ";
    $param = array("sql"=>$sql);
    $r = fn_runs($conn, json_encode($param));
    $rCnt = $r->num_rows;
    if($rCnt == 0) {
        echo "ERROR LOG : 코드(${st_error})에 맞는 정보가 등록되지 않습니다.";
    } else {
        for ($i = 0; $i < $rCnt; $i++) {
            $m_error = $r->fetch_array(MYSQLI_NUM);
            echo "ERROR LOG : " . $m_error[1] . fn_br();
        }
    }
}

/**
 * @class	: fn_show_result
 * @doc		: db로 조회한 result값을 화면에 출력한다.
 * @author	: mongE
 * @version 1.0, 2024.1.7, mongE, create
 */
function fn_show_result($conn, $resultm, $param) {
    $params = json_decode($param, true);
    $columns = "";
    if(!isset($params['columns'])) {
        fn_show_error_info($conn, "ERR_CHK_00001");
        exit();
    } else {
        $columns = explode(",", $params['columns']);
        $idx = 0;
        fn_echo("<table border='1'>");
        while($row = mysqli_fetch_array($resultm)){

            if($idx == 0){
                fn_echo("<tr align='center' padding='0 0 0 0'>");
                foreach ($columns as $key=>$value){
                    fn_echo("<td>${value}</td>");
                }
                fn_echo("</tr>");
            }
            fn_echo("<tr align='center' padding='0 0 0 0'>");
            foreach ($columns as $key=>$value){
                fn_echo("<td>".$row[$value]."</td>");
            }
            fn_echo("</tr>");
            $idx++;
        }
        fn_echo("</table>");

    }

}


function fn_space($cnt) {
    for($i = 0 ; $i < $cnt ; $i++) fn_echo("&nbsp;");
}
?>
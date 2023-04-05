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

?>
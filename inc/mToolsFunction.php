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

?>
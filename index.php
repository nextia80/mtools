<?PHP
/**
	@class  : index.php
	@doc	: index file
	@auther : mongE
	@version : 1.0, 2023.03.14, create
*/
#include "./inc/dbconn.inc"; # 디비정보
#include "./inc/siteinfo.inc"; # 기본세팅
#include "./inc/fn_html.php"; # 공통 html funciton
include "./inc/mtoolsApi.php";
?>
<?=fn_html_header()?>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?=$_title?></title>
</head>
<body>
    <h1>welcom to mTools</h1>
    <br>
    <br>아파치 서버 설정 
    <br>/opt/homebrew/etc/httpd/httpd.conf
    <br>
    <br>아웅 하기 싫어 ㅎㅎ
</body>
</html>
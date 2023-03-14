<html>
<head>
	<title>welcom to mongjoong web api</title>
	<meta charset="utf-8">
	<style type= "text/css">
	<!--
		.body {
			background-color:#F5F5F5;
			display : flex;
			flex-direction:row;
		}
		.content_body {
			display : flex;
			flex-direction:column;
			background-color:lightblue;
		}
		.menu {
			width : 200px;
			background-color:#20B2AA;
			border:1px solid grey;
			padding:5px
		}
		.item {
			width : 900px;
			border:1px solid grey;
		}
		.menu_select {
			background-color:lightblue;
			border:1px solid #3CB371;
			padding:2px
		}
		.menu_no_select {
			background-color:#20B2AA;
			border:1px solid #20B2AA;
			padding:2px
		}
	-->
	</style>
	<script language="JAVASCRIPT">
		function fn_init() {
			fn_chg_menu( document.f.menu_id.value );
		}

		function fn_chg_menu( menu_id ) {
			document.f.menu_id.value = menu_id;

			var html_code = "menu";
			html_code += fn_get_menuTag(menu_id, "1", "1.web api"); //"<div class=\"menu_select\">1. <a href=\"#\" onclick=\"javascript:fn_chg_menu('1')\">web api</a></div>";
			html_code += fn_get_menuTag(menu_id, "2", "2.게시판"); //"<div class=\"menu_no_select\">2. <a href=\"#\" onclick=\"javascript:fn_chg_menu('2')\">22</a></div>";
			// html_code += "<div class=\"menu_no_select\">3</div>";

			var showHtmlTag = document.getElementById("api_menu");
			showHtmlTag.innerHTML = html_code;
		}

		function fn_get_menuTag(menu_selete_id, menu_id, menu_text) {
			var class_name = "menu_no_select";
			if(menu_selete_id == menu_id) class_name = "menu_select";
			return "<div class=\""+class_name+"\"><a href=\"#\" onclick=\"javascript:fn_chg_menu('"+menu_id+"')\">"+menu_text+"</a></div>"
		}

		// ** url parameter를 가져오는 함수, ex )getParameterByName("go"), 2020.01.21 add jinseok ryu
		function getParameterByName(name) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/,"\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
			results = regex.exec(location.search);
			return results === null ? "" : decodeURIComponent(result[1].replace(/\+/g," "));
		}
	</script>
</head>
<body onload= "fn_init()">
<form name="f">
	<header><h1>welcom to mongjoong web api</h1><header>
	<div class="body">
		<div class="menu" id="api_menu"></div>
		<div class="content_body">
			<div class="item">item2</div>
			<div class="item">item3</div>
			<div class="item">item4</div>
			<div class="item">item5</div>
		</div>
	</div>
	<input type="hidden" id="menu_id" value="1">
</form>
</body>
</html>
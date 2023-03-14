<html>	
<head>
	<title>welcom to mongjoong web api :)</title>
	<script type="text/javascript" src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
	<script langeage="JAVASCRIPT">
	function init(){
		// alert("site start");
	}
	function textarea_submit() {
		var f = document.f;
		alert(f.a.value);
	}
	</script>
	
</head>

<body onLoad="init()">
<form name="f" method="post">
	<h1>welcom to mongjoong web api</h1>
	<hr>
	<textarea name="a" id="b" cols="100" rows="5">site test</textarea>
	<input type="button" value="Submit" onclick="textarea_submit()">
	
	
</form>	
</body>
</html>
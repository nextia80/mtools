<style type="text/css">
body {padding:10px;}
* {list-style:none; padding:0; margin:0;}
ul.ul1 {border-left:1px solid blue; width:500px; height:51px;}
ul.ul1 li {float:left; border:1px solid blue; border-left:none; width:51px; height:50px; margin:0 0 0 -1px;}
ul.ul1 li:hover {border:1px solid red; width:50px;}
ul.ul2 {border-top:1px solid blue;  width:100px; }
ul.ul2 li {border:1px solid blue; border-top:none; height:51px; margin:-1px 0 0;}
ul.ul2 li:hover {border:1px solid red; height:50px;}

ul.ul3 {border-left:5px solid blue; width:500px; height:55px; margin:0 0 15px;}
ul.ul3 li {float:left; border:5px solid blue; border-left:none; width:55px; height:50px; margin:0 0 0 -5px;}
ul.ul3 li:hover {border:5px solid red; width:50px;}
ul.ul4 {border-top:5px solid blue;  width:100px; clear:both;}
ul.ul4 li {border:5px solid blue; border-top:none; height:55px; margin:-5px 0 0;}
ul.ul4 li:hover {border:5px solid red; height:50px;}
h2 {clear:both; padding:30px 0 0;}
p {padding:10px 0 0;}
</style>
</head>

<body>

<h1>리스트(ul>li)의 테두리를 hover로만 테두리 색 바꾸기.<br />
가로나 높이 변화 없이, 스크립트 없이 가능 그리고 실체</h1>

<h2>가로로. 가로길이 50px</h2>
<ul class="ul1">
 <li></li>
 <li></li>
 <li></li>
</ul>

<h2>세로로. 세로길이 50px</h2>
<ul class="ul2">
 <li></li>
 <li></li>
 <li></li>
</ul>

<h2>하나의 실체 테두리 5px로 확인사살</h2>
<ul class="ul3">
 <li></li>
 <li></li>
 <li></li>
</ul>
<ul class="ul4">
 <li></li>
 <li></li>
 <li></li>
</ul>
<h2>결론: 1픽셀만 가능</h2>
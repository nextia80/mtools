<html>
<head>
<title>Ajax 테스트 ㄱㄱ</title>
<!-- Ajax를 사용하려면 jquery를 사용하면 편합니다. -->
<script src="//code.jquery.com/jquery-3.3.1.min.js"></script>
<script type="text/javascript">
$( document ).ready(function() {
	//Json을 이용해서 데이타를 가져와 보자. (두번째 버튼)
	$('#no2').click(function(){
		
	    $.ajax({
			url: "testE.php",
    	  	type: "post",		
   			data: $("form").serialize(),
   			dataType:"json",
		}).done(function(data){
			//json을 통해 가져온 데이타를 input_data tag에 넣어준다.
			var html = "";
			for(var i = 0; i<data.name.length; i++){
				html += "<tr>";
				html += "<td>"+data._id[i]+"</td>";
				html += "<td>"+data.name[i]+"</td>";
				html += "<td>"+data.belong[i]+"</td>";
				html += "<td>"+data.phone[i]+"</td>";
				html += "</tr>";
			}
	
			$("#input_data").html(html);
 		}); 
          
	});

	//tbody 안에 있는 내용  지우기
	$('#no3').click(function(){
	    $("#input_data").empty();
	});
	
});
</script>
</head>
<body>
<button id="no2">ajax json 이용해서 데이터 가져와</button>
<button id="no3">리셋</button>
<hr>
<table border="1">
    <thead>
        <tr>
			<th>_id</th>
			<th>name</th>
			<th>belong</th>
			<th>phone</th>
        </tr>
    </thead>
    
    <!-- Ajax를 이용해 DB에서 가져온 데이타를 이곳에 넣어주자. -->
    <tbody id="input_data">
    </tbody>    
</table>

</body>
</html>


<!--

ex : 
	https://abc1211.tistory.com/category/PHP%20%EB%B0%95%EC%82%B4%EB%82%B4%EA%B8%B0/php%20ajax%20json
	https://dororongju.tistory.com/96
-->







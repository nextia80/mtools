<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
<!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js"></script>
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" />
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>
<!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
<!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
<!--[if lt IE 9]>
<script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
<script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
<![endif]-->
<title>calendar</title>


<style>

#main{
border: black 1px solid;
}
#calendar{
border: black 1px solid;
}

table{
width:800px;
height:400px;
text-align:center;
}

th,tr,td{
border: black 1px solid;
}


#b1{
border:1px solid green;
float: left; width: 33%;
}

#a1{
border:1px solid green;
float: left; width: 33%;
}

#m1{
border:1px solid green;
float: left; width: 33%;
}

#box:after{
border:1px solid pink; line-height: 200px; content:""; display:block; clear:both;
}

#before{

width:200px;
height:100px;
}



#after{
width:200px;
height:100px;
}
</style>
</head>



<body>


<div id="result">;
</div>


</body>
</html>

<script>

$(document).ready(function(){

//이번달
load();
function load(){

$.ajax({
url:"now.php",
method:"POST",
success:function(data){
$('#result').html(data);
}

});

}




$(document).on('click', '#before', function(){

var mon = parseInt($('#month').text());
var mon= mon -1;

$.ajax({
url:"before.php",
method:"POST",
data:{mon:mon},
success:function(data){
$('#result').html(data);
}

});

});

$(document).on('click', '#after', function(){

var mon = parseInt($('#month').text());
var mon= mon +1;

$.ajax({
url:"after.php",
method:"POST",
data:{mon:mon},
success:function(data){
$('#result').html(data);
}

});

});





});


</script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js"></script>

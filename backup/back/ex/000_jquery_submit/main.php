<html>
<head>
<title>:: jQuery Ajax 데이터 전송 ::</title>
<script src="https://code.jquery.com/jquery-1.12.4.js"></script>
<script type="text/javascript">
    function ajaxCommunication(mode) {
        
        jQuery.ajax({
              url : "./action.php"
            , type : "POST"

            , async : false

            , data : {
                  mode : mode
                , soney : "xperia"
                , apple : "iphone"
                , google : "pixel"
                , microsoft : "surface"
                , samsung : "galaxy"
                , lg : "optimum"
                , xiaomi : "redmi"
            }
            , success : function(json) {
                var obj = JSON.parse(json);
                if(obj.ret == "succ") {
                    jQuery("#smart > tbody").html(obj.tbody);    
                    alert(obj.message);
                }
            }
        });
    }
</script>
</head>
<body>
    <table id="smart" border="1" width="500px" style="border-collapse:collapse;border:1px #000000 solid;text-align:center;">
        <thead>
            <tr>
                <th>제조사</th>
                <th>브랜드</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>
    <br/>
    <input type="button" onClick="ajaxCommunication('signal');" value="전송"/>
</body>
</html>
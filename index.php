<?php global $_title, $conn;
/**
@class   : m_index.php
@doc     : mTools index page
@author  : mongE
@version : 1.0, 2023.04.24, create
 */
fn_header($_title);
#include "./m_main.php"; # 향후 DB로 대체 하자, 분기로직 삽입)

$_body_tag = array("topmargin" => "0", "leftmargin" => "0" );
fn_body($_body_tag);
fn_echo("<h1>m-Tools Admin Page</h1>");

fn_echo("menu");
fn_br();fn_space(2);fn_echo("* code 관리");
fn_br();fn_space(4);fn_echo("- 메뉴관리");
fn_br();fn_space(4);fn_echo("  - 에러코드관리");
?>
<br>
<br>
<button id="no1">ajax 데이터 가져와</button>
<button id="no2">ajax json 이용해서 데이터 가져와</button>
<button id="no3">리셋</button>
<br>
<br>
<table border="1">
    <thead>
    <tr>
        <th>id_error</th>
        <th>st_error</th>
        <th>tx_error</th>
        <th>yn_use</th>
    </tr>
    </thead>
    <!-- Ajax를 이용해 DB에서 가져온 데이타를 이곳에 넣어주자. -->
    <tbody id="input_data">
    </tbody>
</table>

<script type="text/javascript">
    $("#no1").click(function(){  //button id 값을 설정하고 누르면 클릭이벤트 발생
        var form_data = {
            is_ajax: 1
        };

        $.ajax({
            url: "test_jquery2E.php",
            type: "post",
            data: form_data,
        }).done(function(data){
           //aa = json_decode(data, true);
           //  for(let i = 0; i < data.length; i++){
           //      alert(data[i].name);
           //  }
            var obj = JSON.parse(data);
            for(idx in obj){
                alert(obj[idx]);
            }


        });
    });
    //
    // $( document ).ready(function() {
    //     //Json을 사용하지 않고 데이터를 가져와 보자.(첫번째 버튼)
    //     $('#no1').click(function(){
    //
    //         alert("1");
    //         // $.ajax({
    //         //     url: "source_server_test.php",
    //         //     type: "post",
    //         //     data: $("form").serialize(),
    //         // }).done(function(data){
    //         //     $("#input_data").html(data);
    //         // });
    //
    //     });
    //
    //     //Json을 이용해서 데이타를 가져와 보자. (두번째 버튼)
    //     $('#no2').click(function(){
    //         alert("2");
    //         // $.ajax({
    //         //     url: "source_server_second_test.php",
    //         //     type: "post",
    //         //     data: $("form").serialize(),
    //         //     dataType:"json",
    //         // }).done(function(data){
    //         //     //json을 통해 가져온 데이타를 input_data tag에 넣어준다.
    //         //     var html = "";
    //         //     for(var i = 0; i<data.seq.length; i++){
    //         //         html += "<tr>";
    //         //         html += "<td>Json - "+data.seq[i]+"</td>";
    //         //         html += "<td>"+data.name[i]+"</td>";
    //         //         html += "<td>"+data.age[i]+"</td>";
    //         //         html += "<td>"+data.email[i]+"</td>";
    //         //         html += "</tr>";
    //         //     }
    //         //
    //         //     $("#input_data").html(html);
    //         });
    //
    //     });
    //
    //     //tbody 안에 있는 내용  지우기
    //     $('#no3').click(function(){
    //         alert("3");
    //         // $("#input_data").empty();
    //     });
    // });
</script>

<?php
$sql = "
    WITH r AS (
    SELECT m.id_menu
         , m.id_parent_menu
         , m.nm_menu
         , m.st_lvl
         , m.st_ord, m.st_pass
         , m.st_type,m.yn_use, m.id_insert, m.dt_insert , m.id_update, m.dt_update
     FROM m_menu m
     WHERE m.st_type = 'M'
    )
    SELECT *
      FROM r m
     WHERE m.yn_use ='Y'
    ORDER BY id_parent_menu  asc, st_ord asc
";
$param = array("logYn"=>"N", "sql"=>$sql);
$r = fn_runs($conn, json_encode($param));
$param2 = array("logYn"=>"N", "columns"=>"id_menu,id_parent_menu,nm_menu,st_lvl,st_ord,st_pass,st_type,yn_use,id_insert,dt_insert,id_update,dt_update");
fn_echo("<h3>menu</h3>");


echo json_encode($param2);


$sql = "
    SELECT id_error, st_error, tx_error, yn_use, id_insert, dt_insert, id_update, dt_update 
      FROM m_error
";
$param = array("logYn"=>"N", "sql"=>$sql);
$r = fn_runs($conn, json_encode($param));

$param2 = array("logYn"=>"N", "columns"=>"id_error,st_error,tx_error,yn_use,id_insert,dt_insert,id_update,dt_update");
fn_echo("<h3>m_error</h3>");
fn_show_result($conn, $r, json_encode($param2));






?>

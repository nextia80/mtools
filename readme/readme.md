# funciton 사용법
## 1. db 사용 함수 
* fn_runs 함수
  * $sql = "select id_test, nm_test from m_test where id_test='1' ";
  * $param = array("logYn"=>"N", "sql"=>$sql);
  * $r = fn_runs($conn, json_encode($param));


    $sql = "select id_test, nm_test from m_test where id_test='1' ";
    $param = array("logYn"=>"N", "sql"=>$sql);
    $r = fn_runs($conn, json_encode($param));
    if($r) {
        if ($r->num_rows > 0) {
        fn_echo("<table border=1>");
        fn_echo("<tr>");
        fn_echo("<td>id</td>");
        fn_echo("<td>nm</td>");
        fn_echo("</tr>");
            while ($row = $r->fetch_assoc()) {
                fn_echo("<tr>");
                fn_echo("<td>" . $row["id_test"] . "</td>");
                fn_echo("<td>" . $row["nm_test"] . "</td>");
                fn_echo("</tr>");
            }
            fn_echo("</table>");
        } else {
            fn_echo("0 results");
        }
    }

* fn_br / fn_newLine / fn_echo

## 만들어야 할 메뉴
* 코드관리
* 메뉴관리
* 사용자관리

#jQuery로 select / insert / update / delete 문 만들기
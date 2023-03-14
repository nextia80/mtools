<?php
$RetVal = array("ret"=>"fail", "error"=>"", "error_msg"=>"", "message"=>"");
$backUrl = $_SERVER['HTTP_REFERER'];

switch($_POST['mode']) {

    case "signal" :
       

        // $RetVal 라는 배열에 tbody 라는값을 새로 추가한다.



        $RetVal['tbody'] .= "<tr>";
        $RetVal['tbody'] .= "<td>소니</td>";
        $RetVal['tbody'] .= sprintf("<td>%s</td>", $_POST['soney']);
        $RetVal['tbody'] .= "</tr>";
        $RetVal['tbody'] .= "<tr>";
        $RetVal['tbody'] .= "<td>애플</td>";
        $RetVal['tbody'] .= sprintf("<td>%s</td>", $_POST['apple']);
        $RetVal['tbody'] .= "</tr>";
        $RetVal['tbody'] .= "<tr>";
        $RetVal['tbody'] .= "<td>구글</td>";
        $RetVal['tbody'] .= sprintf("<td>%s</td>", $_POST['google']);
        $RetVal['tbody'] .= "</tr>";
        $RetVal['tbody'] .= "<tr>";
        $RetVal['tbody'] .= "<td>MS</td>";
        $RetVal['tbody'] .= sprintf("<td>%s</td>", $_POST['microsoft']);
        $RetVal['tbody'] .= "</tr>";
        $RetVal['tbody'] .= "<tr>";
        $RetVal['tbody'] .= "<td>삼성</td>";
        $RetVal['tbody'] .= sprintf("<td>%s</td>", $_POST['samsung']);
        $RetVal['tbody'] .= "</tr>";
        $RetVal['tbody'] .= "<tr>";
        $RetVal['tbody'] .= "<td>LG</td>";
        $RetVal['tbody'] .= sprintf("<td>%s</td>", $_POST['lg']);
        $RetVal['tbody'] .= "</tr>";
        $RetVal['tbody'] .= "<tr>";
        $RetVal['tbody'] .= "<td>샤오미</td>";
        $RetVal['tbody'] .= sprintf("<td>%s</td>", $_POST['xiaomi']);
        $RetVal['tbody'] .= "</tr>";
        
        $RetVal['message'] = "제조사별 브랜드를 조회하는데 성공하였습니다.";
        $RetVal['ret'] = "succ";



        print json_encode($RetVal);
        return;

    break;

    default :
    break;
}

header("location:".$backUrl);
?>
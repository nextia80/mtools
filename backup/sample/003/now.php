<?php
$now_time = time();

$month=date("n",$now_time);
$daily = array('일','월','화','수','목','금','토');
$sec = mktime(0, 0, 0, $month, 1, 2017);
$firstday=date("j",$sec); //1
$lastday=date("t",$sec); //30
$firstyoil=date("w",$sec); //5 //


$output = '';

$output .= '<div id="box">
<div id="b1"><center><input type="button" name="before" id="before" value="지난달"></center></div>
<div id="m1"><h1 align="center" id="month">'.$month.'</h1></div>
<div id="a1"><center><input type="button" name="after" id="after" value="다음달"></center></div>
</div>';

$output .='<table align="center">';
$num = 1;

$output .= '<tr>';

//일 - 토
for($i=0;$i<7;$i++){
$output .= '<td>'.$daily[$i].'</td>';
}

$output .= '</tr>';


//줄
for($i=0; $i<count($daily)-2; $i++)
{

$output.= '<tr id="'.$i.'">';
//칸
for($ii=0; $ii<count($daily);$ii++)
{

if($i==0 && $ii<$firstyoil){
$output .= '<td></td>';
}else{

if($num > $lastday){
$output .= '<td></td>';
}else{
$output .= '<td id="'.$ii.'">'.$num.'</td>';
$num++;
}
}
}

$output .= '</tr>';
}
$output .= '</table>';

echo $output;
?>
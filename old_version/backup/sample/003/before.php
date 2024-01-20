<?php


$daily = array('일','월','화','수','목','금','토');
$sec = mktime(0, 0, 0, $_POST['mon'], 1, 2017);
$month=date("n",$sec); //달
$firstday=date("j",$sec); //첫째날
$lastday=date("t",$sec); //마지막째날
$firstyoil=date("w",$sec); //첫째날 요일 // 5


$output = '';

$output .='<div id="box"><div id="b1"><center><input type="button" name="before" id="before" value="지난달"></center></div>
<div id="m1"><h1 align="center" id="month">'.$month.'</h1></div>
<div id="a1"><center><input type="button" name="after" id="after" value="다음달"></center></div></div>';
$output .='<table align="center">';
$num = 1;

$output .= '<tr>';
for($i=0;$i<7;$i++){
$output .= '<td>'.$daily[$i].'</td>';
}

$output .= '</tr>';

for($i=0; $i<count($daily)-2; $i++)
{

$output.= '<tr id="'.$i.'">';
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

<?php
    fn_html_body();


    $size = "large";
    $var_array = array("color" => "blue",
    "size"  => "medium",
    "shape" => "sphere");
extract($var_array, EXTR_PREFIX_SAME, "wddx");

echo "$color, $size, $shape, $wddx_size\n";

$var_array = array("color2" => "11",
                   "size2"  => "12",
                   "shape2" => "13");
extract($var_array);

echo fn_mTag_br()."$color2, $size2, $shape2, $wddx_size\n";
?>

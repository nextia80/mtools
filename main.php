<?php

    /** markdown ************************************************************************/
    /*
    markdown Ex
    spl_autoload_register(function($class){
        require str_replace('\\', DIRECTORY_SEPARATOR, ltrim($class, '\\')).'.php';
    });
    use Michelf\Markdown;
    */    
    //$text = file_get_contents('README.md');
    //$html = Markdown::defaultTransform($text);
    //echo  $html;
    /** markdown ************************************************************************/
    
    $_body_tag = array("topmargin" => "0", "leftmargin" => "0" );
    fn_html_body($_body_tag);
?>
    <style>
    div {
        border-style:solid;
    } 


    </style>

    
    <div class="con" style="display:table; width:800px;">
        <div style="display:table-row">
            <div class ="A" style="display:table-cell">A</div>
            <div class ="B" style="display:table-cell">B</div>
            <div class ="C" style="display:table-cell">C</div>
            <div class ="D" style="display:table-cell">D</div>
        </div>
        <div style="display:table-row">
            <div class ="A" style="display:table-cell">A</div>
            <div class ="B" style="display:table-cell">B</div>
            <div class ="C" style="display:table-cell">C</div>
            <div class ="D" style="display:table-cell">D</div>
        </div>
    </div>
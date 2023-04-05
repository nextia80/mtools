<?php
    /** markdown ************************************************************************/
    spl_autoload_register(function($class){
        require str_replace('\\', DIRECTORY_SEPARATOR, ltrim($class, '\\')).'.php';
    });
    use Michelf\Markdown;
    /** markdown ************************************************************************/
    $text = file_get_contents('README.md');
    $html = Markdown::defaultTransform($text);

    $_body_tag = array("topmargin" => "0", "leftmargin" => "0" );
    fn_html_body($_body_tag);
	echo $html;
?>
welcom to mTools
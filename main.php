<?php    /** markdown ************************************************************************/
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

#table2 {display: table; width: 100%;}
.row {display: table-row;}
.cell {display: table-cell; padding: 3px; border-bottom: 1px solid #DDD;}
.col1 {width: 20%;}
.col2 {width: 20%;}
.col3 {width: 40%;}
.col4 {width: 20%;}


/* DivTable.com */
.divTable{
	display: table;
	width: 100%;
}
.divTableRow {
	display: table-row;
}
.divTableHeading {
	background-color: #EEE;
	display: table-header-group;
}
.divTableCell, .divTableHead {
	border: 1px solid #DDD;
	display: table-cell;
	padding: 3px 10px;
}
.divTableHeading {
	background-color: #EEE;
	display: table-header-group;
	font-weight: bold;
}
.divTableFoot {
	background-color: #EEE;
	display: table-footer-group;
	font-weight: bold;
}
.divTableBody {
	display: table-row-group;
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


    <br><br>

<div id="table2">
    <div class="row">
        <span class="cell col1">열 1-1</span>
        <span class="cell col2">열 1-2</span>
        <span class="cell col3">열 1-3</span>
        <span class="cell col4">열 1-4</span>
    </div>
    <div class="row">
        <span class="cell col1">열 2-1</span>
        <span class="cell col2">열 2-2</span>
        <span class="cell col3">열 2-3</span>
        <span class="cell col4">열 2-4</span>
</div>
</div>

<br><br>

<div class="divTable" style="width: 20%;">
	<div class="divTableBody">
		<div class="divTableRow">
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
		</div>

		<div class="divTableRow">
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
		</div>

		<div class="divTableRow">
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
		</div>

		<div class="divTableRow">
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
			<div class="divTableCell">&nbsp;</div>
		</div>
	</div>
</div>
<!-- DivTable.com -->
 
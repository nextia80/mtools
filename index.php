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
fn_show_result($conn, $r, json_encode($param2));


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

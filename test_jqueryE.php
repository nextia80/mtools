<?php
echo "success";

if(!isset($_POST['is_ajax'])) exit;
if(!isset($_POST['user_id'])) exit;
if(!isset($_POST['user_pw'])) exit;
$is_ajax=$_POST['is_ajax'];
$user_id = $_POST['user_id'];
$user_pw = $_POST['user_pw'];
$members = [
        'user1'=>['pw'=>'pw1', 'name'=>'김일구'],
        'user2'=>['pw'=>'pw2', 'name'=>'박이팔'],
        'user3'=>['pw'=>'pw3', 'name'=>'최삼칠'],
];

if(!$is_ajax) exit;
if(!isset($members[$user_id])) exit;
if($members[$user_id]['pw'] != $user_pw) exit;
echo "success";	
?>
<script type="text/javascript">
$(document).ready(function() {
	$("#login").click(function() {
		var action = $("#form1").attr('action');
		var form_data = {
			user_id: $("#user_id").val(),
			user_pw: $("#user_pw").val(),
			is_ajax: 1
		};
		$.ajax({
			type: "POST",
			url: action,
			data: form_data,
			success: function(response) {
				if(response == 'success') {
					$("#message").html("<p style='color:green;font-weight:bold'>로그인 성공!</p>");
					$("#form1").slideUp('slow');
				}
				else {
					$("#message").html("<p style='color:red'>아이디 또는 비밀번호가 잘못되었습니다.</p>");	
				}
			}
		});
		return false;
	});
});
</script>

<?PHP
$_body_tag = array("topmargin" => "0", "leftmargin" => "10" );
fn_body($_body_tag);
?>
<h1>MJCT</h1> 
<? echo "접속시간 : ". date("Y-m-d H:i:s")."<br/>"; ?>

<form id="form1" name="form1" action="test_jqueryE.php" method="post">
<table>
<tr>
	<td>아이디</td>
	<td><input type='text' id='user_id' name='user_id' tabindex='1'/></td>
	<td rowspan='2'><input type='button' id='login' tabindex='3' value='로그인' style='height:50px'/></td>
</tr>
<tr>
	<td>비밀번호</td>
	<td><input type='password' id='user_pw' name='user_pw' tabindex='2'/></td>
</tr>
</table>
</form>
<div id="message"></div>

<br>
<br>
DB 설계
<pre>
회원가입
m_mem
  (PK) id_mem 아이디(시쿼스)
  st_mem 아이디(커스텀)
  nm_mem 이름
  yn_use 사용여부
  yn_del 삭제여부
  (FK) id_grp 권한레벨
  id_insert
  dt_insert
  id_update
  dt_update

m_grp
  (PK) id_grp
  nm_grp
  yn_use
  id_insert
  dt_insert
  id_update
  dt_update

m_menu
  (PK) id_memu
  nm_menu
  yn_use
  id_insert
  dt_insert
  id_update
  dt_update

m_grp_menu
  id_menu
  id_grp
  id_mem
  yn_use
  id_insert
  dt_insert
  id_update
  dt_update
  
</pre>

-- DB table 
create table board_free (
	b_no int unsigned not null primary key auto_increment
,	b_title varchar(100) not null
,	b_content text not null
,	b_date datetime not null
,	b_hit int unsigned not null default 0
,	b_id varchar(20) not null
,	b_password varchar(100) not null
);



--

각 컬럼은 순서대로 번호, 제목, 내용, 작성일, 조회수, 아이디, 패스워드입니다.


차근차근 설명해드리겠습니다.
int는 정수형 자료라는 뜻으로 4바이트의 저장공간(-2147483648 ~ 2147483647)를 가지고 있습니다.
b_no과 b_hit에는 unsigned라는 옵션이 존재하는데, unsigned가 존재하면 해당 자료형을 양수로만 사용한다는 뜻입니다.
부호(-)가 없다는 뜻이죠.
그러므로 같은 4바이트의 저장 공간이지만 부호가 없기 때문에 4294967295까지의 숫자를 저장할 수 있습니다.

그리고 모든 컬럼이 가지고 있는 not null은 null 값(비어있는 값으로 공백과는 다름)을 지닐 수 없다는 이야기입니다.
제가 만든 항목 중에서 null 값이 들어갈만한 항목은 없기 때문이죠.

b_no에 있는 primary key는 기본키를 나타냅니다.
기본키는 데이터베이스 테이블에서 각각의 자료들을 식별할 수 있는 값이어야 합니다.
한국인으로 따지면 주민등록번호, 학생은 학번인 것처럼 말이죠.

그리고 primary key 옆의 auto_increment는 자동으로 카운트를 올려주는 옵션입니다.
만약 데이터가 들어온다면 1, 2, 3, 4, 5... 처럼 순서대로 숫자가 올라갑니다.
고유 번호를 만들어주는거죠.

마지막 옵션은 b_hit의 default 0입니다.
이 옵션은 데이터를 입력 받을 때 입력된 값이 없다면 기본 값으로 null이 아니라 0을 입력해줍니다.
조회수는 언제나 0에서 시작하니까요.

이렇게 게시판에 들어갈 데이터베이스 테이블을 알아봤습니다.
다음 포스팅에서는 목록을 만들어보도록 하겠습니다.

제작 중인 사이트는 http://kurien.dothome.co.kr이구요,
지적 사항이나 어려운 부분은 댓글에 남겨주세요!
--

service mysql start
mysql -u root -psince2020 DS_MTOOLS;



select a.n, count(a.n) as c
  from (
select CONCAT( LPAD(lotto_num1,2,'0'), LPAD(lotto_num2,2,'0'), LPAD(lotto_num3,2,'0')) as n  from m_lotto
union all select CONCAT( LPAD(lotto_num1,2,'0'), LPAD(lotto_num2,2,'0'), LPAD(lotto_num4,2,'0')) as n  from m_lotto
union all select CONCAT( LPAD(lotto_num1,2,'0'), LPAD(lotto_num2,2,'0'), LPAD(lotto_num5,2,'0')) as n  from m_lotto
union all select CONCAT( LPAD(lotto_num1,2,'0'), LPAD(lotto_num2,2,'0'), LPAD(lotto_num6,2,'0')) as n  from m_lotto
union all select CONCAT( LPAD(lotto_num2,2,'0'), LPAD(lotto_num3,2,'0'), LPAD(lotto_num4,2,'0')) as n  from m_lotto
union all select CONCAT( LPAD(lotto_num2,2,'0'), LPAD(lotto_num3,2,'0'), LPAD(lotto_num5,2,'0')) as n  from m_lotto
union all select CONCAT( LPAD(lotto_num2,2,'0'), LPAD(lotto_num3,2,'0'), LPAD(lotto_num6,2,'0')) as n  from m_lotto
union all select CONCAT( LPAD(lotto_num3,2,'0'), LPAD(lotto_num4,2,'0'), LPAD(lotto_num5,2,'0')) as n  from m_lotto
union all select CONCAT( LPAD(lotto_num3,2,'0'), LPAD(lotto_num4,2,'0'), LPAD(lotto_num6,2,'0')) as n  from m_lotto
union all select CONCAT( LPAD(lotto_num4,2,'0'), LPAD(lotto_num5,2,'0'), LPAD(lotto_num6,2,'0')) as n  from m_lotto
) a
group by a.n
having count(a.n) > 3
order by count(a.n) desc
;
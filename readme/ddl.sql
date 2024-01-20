
-- m_error table : error code 값을 정의 한 테이블
CREATE TABLE m_error(
      id_error int NOT NULL AUTO_INCREMENT COMMENT 'error code table id'
    , st_error varchar(100) NOT NULL comment 'error code 식별 code'
    , tx_error text NOT NULL comment 'error code 내용'
    , yn_use char(2) DEFAULT 'Y' COMMENT '사용여부'
    , id_insert varchar(30) DEFAULT NULL COMMENT '입력자'
    , dt_insert datetime DEFAULT CURRENT_TIMESTAMP COMMENT '입력시간'
    , id_update varchar(30) DEFAULT NULL COMMENT '수정자'
    , dt_update datetime DEFAULT CURRENT_TIMESTAMP COMMENT '수정시간'
    , PRIMARY KEY (id_error)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COMMENT='mTools error code table';


-- 시쿼스 초기화
ALTER TABLE m_menu AUTO_INCREMENT=1;

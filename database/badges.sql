/*

+─────────┌───────────┌───────────+
|BADGE_ID |BADGE_NAME |BADGE_DESC | 
+─────────└───────────└───────────+
BAGDE_ID            INT             AUTO_INCREMENT              PRIMARY KEY,
BADGE_NAME          VARCHAR(50)     NOT NULL,
BADGE_DESC          VARCHAR(500)    NOT NULL,

*/

CREATE TABLE BADGES (
    BADGE_ID INT AUTO_INCREMENT PRIMARY KEY,
    BADGE_NAME VARCHAR(50) NOT NULL,
    BADGE_DESC VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/

INSERT INTO BADGES (BADGE_NAME, BADGE_DESC) VALUES
,('First Policy Approved', 'Awarded for having your first policy approved.')
,('Risk Hunter', 'Awarded for identifying potential risks in policies.')
,('Security Aware', 'Awareness-Training completed successfully.')
,('Policy Reader', 'Awarded for reading 10 policies.')
,('Consistency King', 'Awarded for logging in 100 times')
;

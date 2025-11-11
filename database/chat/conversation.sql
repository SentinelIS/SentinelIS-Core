/*

+────────┌─────────┌───────────┌─────────────────+
|CONV_ID |IS_GROUP |CONV_TITLE |CONV_CREATE_DATE |
+────────└─────────└───────────└─────────────────+

CONV_ID             INT             NOT NULL    AUTO_INCREMENT      PRIMARY KEY,
IS_GROUP            BOOLEAN         NOT NULL    DEFAULT FALSE,
CONV_TITLE          VARCHAR(100)                DEFAULT NULL, 
CONV_CREATE_DATE    DATETIME                    DEFAULT CURRENT_TIMESTAMP

$Descriptions:
--------------
    $conv_id:           Identifier for the conversation.
    $is_group:          Boolean indicating if the conversation is a group chat.
    $conv_title:        Title of the conversation, applicable for group chats.
    $conv_create_date:  Timestamp marking when the conversation was created. 
*/

CREATE TABLE CONVERSATION (
    CONV_ID        INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    IS_GROUP       BOOLEAN NOT NULL DEFAULT FALSE,
    CONV_TITLE     VARCHAR(100) DEFAULT NULL, -- nur für Gruppen nötig
    CONV_CREATE_DATE DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

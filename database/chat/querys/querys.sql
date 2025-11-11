/*

CONTACT LIST FOR CHAT SIDEBAR UI:
Query to retrieve all users in the same company excluding the current user.

*/
SELECT u.USER_ID,
       CONCAT(u.USER_FIRST_NAME, ' ', u.USER_SURNAME) AS FullName,
       u.USER_ABBR
FROM USERS u
WHERE u.COMP_ID = :myCompId
AND u.USER_ID != :me;

/*

FIND ONE-ON-ONE CONVERSATION BETWEEN TWO USERS:
Query to find a direct (non-group) conversation involving exactly two specified users.

*/
SELECT c.CONV_ID
FROM CONVERSATION c
JOIN CONVERSATION_PARTICIPANTS cp1 ON c.CONV_ID = cp1.CONV_ID
JOIN CONVERSATION_PARTICIPANTS cp2 ON c.CONV_ID = cp2.CONV_ID
WHERE cp1.USER_ID = :A
  AND cp2.USER_ID = :B
  AND c.IS_GROUP = 0;



/*
LOAD MESSAGES FOR A GIVEN CONVERSATION:
Query to retrieve all messages for a specific conversation, ordered by the time they were sent.
*/
SELECT m.SENDER_ID,
       m.MSG_TEXT,
       m.MSG_SENT_AT
FROM MESSAGES m
WHERE m.CONV_ID = :conversationId
ORDER BY m.MSG_SENT_AT;

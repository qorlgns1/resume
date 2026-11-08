ALTER TABLE `interview_notes` ADD `answers` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
-- 질문의 핵심 답변(summary)을 "기본" 답 하나로 옮기고, 질문의 summary는 비운다. 용어의 한 줄 정의는 그대로 둔다.
UPDATE `interview_notes`
SET `answers` = json_array(json_object('id', 'ans_default', 'label', '기본', 'text', `summary`)),
    `summary` = ''
WHERE `kind` = 'question' AND `summary` <> '';

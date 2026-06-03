-- Per-questionnaire display mode for the viewer pin form.
--   scroll: all questions on one scrollable form (legacy default)
--   step:   one question per screen (wizard with Next/Back)
ALTER TABLE questionnaires
  ADD COLUMN display_mode VARCHAR(16) NOT NULL DEFAULT 'scroll'
  COMMENT 'scroll | step';

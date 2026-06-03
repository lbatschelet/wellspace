# Wellspace API

Base URL: `/api`

All responses are JSON. Errors use `{"error": "message"}` with appropriate HTTP status.

## Public endpoints

### `GET /pins.php`
List approved pins.

Query params:
- `floor` (optional, int)

Response:
```json
[
  {
    "id": 1,
    "floor_index": 0,
    "position_x": 1.2,
    "position_y": 0.3,
    "position_z": -2.1,
    "wellbeing": 6,
    "reasons": ["licht", "ruhe"],
    "note": "string",
    "group_key": "staff",
    "station_key": "eg-01",
    "questionnaire_key": "default",
    "generic_answers": { "some_question": "value" },
    "approved": 1,
    "created_at": "2026-01-01 12:00:00"
  }
]
```

### `POST /pins.php`
Create a pin. Accepts the dynamic questionnaire payload.

Body:
```json
{
  "floor_index": 0,
  "x": 1.2,
  "y": 0.3,
  "z": -2.1,
  "answers": {
    "wellbeing": 6,
    "reasons": ["licht", "ruhe"],
    "group": "staff",
    "note": "string"
  }
}
```

Response: the created pin (same shape as `GET /pins.php`).

#### Answer formats per question type

Answers are passed inside `answers` (legacy keys `wellbeing`, `reasons`, `group`, `note`)
or `generic_answers` (any other question key). Storage in `pin_answers.answer_text`:

| Type | Accepted input | Stored as |
|------|----------------|-----------|
| `slider` | number | `answer_numeric` |
| `text` | string | `answer_text` |
| `influence` | object `{ "<option>": -1..1 }` | JSON in `answer_text` |
| `multi` | string, array of keys, or object | JSON `{"selected":[...], "other_text"?:"..."}` in `answer_text` |

For `multi` the canonical input/output is:

```json
{ "selected": ["a", "b", "other"], "other_text": "free text when 'other' is selected" }
```

A bare string (`"a"`) or array (`["a","b"]`) is also accepted and normalized to the
object form. Validation rules:

- Selected keys must be active `question_options` of the question.
- `other` may only be selected when the question has `allow_other: true`.
- When `other` is selected, `other_text` is required and limited to `other_max_length`
  (otherwise `400`).
- Empty selections (no options, no other text) are dropped (not stored).

When read back (in `generic_answers` of `GET /pins.php` and admin listings), `multi`
and `influence` answers are returned as decoded JSON objects/arrays.

### `GET /questions.php`
Fetch the active questionnaire configuration.

Query params:
- `lang` (optional, defaults to `de`)

Response:
```json
[
  {
    "key": "wellbeing",
    "type": "slider",
    "required": true,
    "sort": 10,
    "config": { "min": 1, "max": 10, "step": 1, "default": 6 },
    "label": "How do you feel here?",
    "legend_low": "Not good at all",
    "legend_high": "Very good"
  },
  {
    "key": "reasons",
    "type": "multi",
    "required": false,
    "sort": 20,
    "config": { "allow_multiple": true },
    "label": "What contributes to your (un)wellbeing?",
    "options": [
      { "key": "licht", "sort": 10, "label": "Light" }
    ]
  }
]
```

#### `multi` question type

`config` fields for `type: "multi"`:

| Field | Type | Default | Meaning |
|-------|------|---------|---------|
| `allow_multiple` | bool | `false` | Allow selecting more than one option (checkboxes vs. radios). |
| `allow_other` | bool | `false` | Show an additional "Other" option with a free-text field. |
| `other_option_key` | string | `"other"` | Option key used for the "Other" choice. A real `question_options` row with this key is created so the label is translatable (`options.{question}.other`). |
| `other_max_length` | int | `500` | Maximum length of the free-text entered for "Other". |

### `GET /languages.php`
List enabled languages for the webapp switcher.

Response:
```json
[
  { "lang": "de", "label": "Deutsch" },
  { "lang": "en", "label": "English" }
]
```

### `GET /translations.php`
Fetch translations by language.

Query params:
- `lang` (required)
- `prefix` (optional, e.g. `questions.` or `options.reasons.`)

Response:
```json
{
  "questions.wellbeing.label": "How do you feel here?",
  "options.reasons.licht": "Light"
}
```

### `GET /questionnaire.php`
Resolve a questionnaire by key. Falls back to the default questionnaire.

Query params:
- `key` (optional, defaults to `default`)
- `lang` (optional, defaults to `de`)

Response: an object with the questionnaire metadata and the resolved question list.

```json
{
  "display_mode": "scroll",
  "questions": [ /* same shape as GET /questions.php */ ]
}
```

- `display_mode`: `"scroll"` (all questions on one scrollable form, default) or
  `"step"` (the viewer shows one question per step with Back/Next navigation).
- Clients should read `questions` from this object. The viewer normalizes a legacy
  bare-array response to `{ questions, displayMode: "scroll" }` for backward compatibility.

### `GET /stations.php`
Get station info by key.

Query params:
- `key` (required)

Response:
```json
{
  "station_key": "eg-01",
  "name": "Station EG 01",
  "floor_index": 0,
  "camera": { "x": 1.2, "y": 3.0, "z": -2.1 },
  "target": { "x": 0.5, "y": 0.0, "z": -1.0 },
  "questionnaire_key": "default"
}
```

### `GET /content.php`
Fetch a content page (e.g. About text).

Query params:
- `key` (required, e.g. `about`)
- `lang` (optional, defaults to `de`)

Response:
```json
{
  "body": "# Welcome\nMarkdown content...",
  "updated_at": "2026-01-15 10:30:00"
}
```

## Admin endpoints

All admin requests require a JWT Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### `GET /admin_auth.php`
Check auth/bootstrap status.

Response:
```json
{ "bootstrap_required": false }
```

### `POST /admin_auth.php`
Authentication actions.

**Login:**
```json
{ "action": "login", "email": "admin@example.com", "password": "secret" }
```
Response:
```json
{ "token": "eyJ...", "user": { "id": 1, "email": "admin@example.com", "first_name": "Admin", "is_admin": true } }
```

**Bootstrap login** (first-time setup with admin_token from config):
```json
{ "action": "bootstrap_login", "admin_token": "your_configured_token" }
```

**Set password** (via reset token):
```json
{ "action": "set_password", "reset_token": "abc123", "password": "new_password" }
```

**Refresh token:**
```json
{ "action": "refresh" }
```
(Requires existing valid JWT in Authorization header.)

### `GET /admin_pins.php`
List all pins (including pending/rejected).

### `POST /admin_pins.php`
Update pin status or delete pins.

Body examples:
```json
{ "action": "update_approval", "ids": [1,2], "approved": 1 }
```
```json
{ "action": "delete", "ids": [1,2] }
```

### `GET /admin_questions.php`
List all questions.

### `POST /admin_questions.php`
Upsert or delete a question.

Body examples:
```json
{
  "action": "upsert",
  "question_key": "wellbeing",
  "type": "slider",
  "required": 1,
  "sort": 10,
  "is_active": 1,
  "config": { "min": 1, "max": 10, "step": 1, "default": 6 }
}
```
```json
{ "action": "delete", "question_key": "note" }
```

### `GET /admin_options.php`
List all options, optionally filtered by `question_key`.

### `POST /admin_options.php`
Upsert or delete an option.

Body examples:
```json
{
  "action": "upsert",
  "question_key": "group",
  "option_key": "staff",
  "sort": 10,
  "is_active": 1
}
```
```json
{ "action": "delete", "question_key": "group", "option_key": "staff" }
```

### `GET /admin_languages.php`
List all languages.

### `POST /admin_languages.php`
Upsert, toggle, or delete a language.

Body examples:
```json
{ "action": "upsert", "lang": "de", "label": "Deutsch", "enabled": 1 }
```
```json
{ "action": "toggle", "lang": "en", "enabled": 0 }
```
```json
{ "action": "delete", "lang": "fr" }
```

### `POST /admin_translations.php`
Upsert or delete translations.

Body examples:
```json
{
  "action": "upsert",
  "translation_key": "questions.note.label",
  "lang": "de",
  "text": "Anmerkung"
}
```
```json
{ "action": "delete", "translation_key": "questions.note.label", "lang": "de" }
```

### `GET /admin_users.php`
List all admin users. Requires admin role.

Response:
```json
[
  { "id": 1, "email": "admin@example.com", "first_name": "Admin", "last_name": "User", "is_admin": true }
]
```

### `POST /admin_users.php`
Manage admin users. Requires admin role.

**Create user:**
```json
{ "action": "create", "email": "new@example.com", "first_name": "New", "last_name": "User", "is_admin": false }
```
Response includes a `reset_link` for setting the initial password.

**Update user:**
```json
{ "action": "update", "user_id": 2, "first_name": "Updated", "is_admin": true }
```

**Delete user:**
```json
{ "action": "delete", "user_id": 2 }
```

**Reset password:**
```json
{ "action": "reset_password", "user_id": 2 }
```
Response includes a new `reset_link`.

**Update own profile** (any authenticated user):
```json
{ "action": "update_self", "first_name": "New Name", "last_name": "New Last" }
```

### `GET /admin_audit.php`
Fetch audit log entries with pagination.

Query params:
- `limit` (optional, default 50)
- `offset` (optional, default 0)

Response:
```json
{
  "items": [
    { "id": 1, "user_id": 1, "action": "login", "details": "{}", "created_at": "2026-01-01 12:00:00" }
  ],
  "total": 42
}
```

### `GET /admin_pins.php?action=export_csv`
Export all pins as wide CSV file. Includes dynamic answer columns (`answer__{question_key}`),
`asked_questions`, and unified `answers_json` (legacy + generic answers).
Returns `Content-Type: text/csv` with a timestamped filename.

JSON-backed answers are rendered human-readable in the `answer__{key}` columns:

- `multi`: selected option keys joined with `; `; an "Other" entry is appended as
  `other: "free text"` (e.g. `licht; ruhe; other: "zu warm"`).
- `influence`: `option: value` pairs joined with `; ` (e.g. `licht: 0.5; laerm: -1`).

The full structured value is always available in the `answers_json` column.

### `GET /admin_pins.php?action=export_csv_long`
Export all pins as long CSV file (one row per asked question per pin) with
`answer_kind`, `answer_text`, `answer_numeric`, and `answer_json`. For `multi` and
`influence` questions `answer_kind` is `json` and the decoded value is in `answer_json`.

### `GET /admin_questionnaires.php`
List all questionnaires with their slots.

Response:
```json
[
  {
    "id": 1,
    "questionnaire_key": "default",
    "name": "Default",
    "description": null,
    "is_default": 1,
    "display_mode": "scroll",
    "slots": [
      { "id": 1, "sort": 10, "is_active": 1, "is_required": 0, "question_key": "wellbeing" }
    ]
  }
]
```

### `POST /admin_questionnaires.php`
Manage questionnaires.

**Upsert questionnaire:**
```json
{ "action": "upsert", "questionnaire_key": "my-survey", "name": "My Survey", "description": "...", "display_mode": "step" }
```

`display_mode` is optional and defaults to `"scroll"`. Valid values: `"scroll"` |
`"step"` (invalid values are normalized to `"scroll"`). The same field is accepted by
the `save_full` action used by the admin questionnaire editor.

**Delete questionnaire:**
```json
{ "action": "delete", "id": 1 }
```

**Upsert slot (add/update a question in a questionnaire):**
```json
{ "action": "upsert_slot", "questionnaire_id": 1, "question_key": "wellbeing", "sort": 10, "is_active": 1, "is_required": 1 }
```

**Delete slot:**
```json
{ "action": "delete_slot", "id": 5 }
```

### `GET /admin_stations.php`
List all stations with their assigned questionnaire name.

### `POST /admin_stations.php`
Manage stations.

**Upsert station:**
```json
{
  "action": "upsert",
  "station_key": "eg-01",
  "name": "Station EG 01",
  "floor_index": 0,
  "camera_x": 1.2, "camera_y": 3.0, "camera_z": -2.1,
  "target_x": 0.5, "target_y": 0.0, "target_z": -1.0,
  "questionnaire_id": 1,
  "is_active": 1
}
```

**Delete station:**
```json
{ "action": "delete", "id": 1 }
```

### `GET /admin_content.php`
List all content pages.

### `POST /admin_content.php`
Upsert or delete content pages.

**Upsert:**
```json
{ "action": "upsert", "page_key": "about", "lang": "de", "body": "# About\nMarkdown..." }
```

**Delete:**
```json
{ "action": "delete", "page_key": "about", "lang": "de" }
```

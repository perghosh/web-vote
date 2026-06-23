# Web Vote Frontend to Atomic Server API

This file describes the runtime contract between the frontend in `target/vote` and the atomic HTTP server API documented in `C:/dev/home/DOD/target/server/http/api/README.MD`.

The goal is to help new developers understand:

- which endpoints are used by each page
- how request payloads are encoded
- which named SQL queries must exist in server metadata
- what response shape the frontend expects

## 1. Server API Groups Used By This Frontend

From the server API README, this frontend uses these groups:

- `db/select`
- `db/insert`
- `db/update`
- `db/delete`
- `sys/client/ip`
- `sys/meta/query/count`
- `xml` (called from frontend as `!xml`)

The frontend prefixes internal endpoints with `!`.

Examples:

- `!db/select`
- `!sys/client/ip`
- `!xml`

## 2. Frontend Transport Layer

Primary client transport is in `target/vote/js/gd_server.js`.

Main methods:

- `gd.Send(sEndpoint, arguments_, body_)`
- `gd.SendToServer(sBaseUrl, sEndpoint, arguments_, body_)`

Response contract returned to callers:

```javascript
{ format, data, status }
```

- `format`: `json`, `xml`, or `text`
- `data`: parsed response payload
- `status`: HTTP status code

In this project, most calls expect XML and parse one or more `<result>` nodes.

## 3. Request Encoding Rules

### 3.1 Legacy key/value string style

Many pages send newline-separated `key=value` entries, for example:

```text
query=#cast-check_if_voted
values={"PollK":"...","FIp":"..."}
```

The wrapper URL-encodes each key/value pair and appends it to the endpoint query string.

### 3.2 Object as query parameters

If `arguments_` is an object in `gd.Send`, keys become query parameters:

```javascript
gd.Send("!db/select?", { query: "#code-get_list", values: JSON.stringify({ "TCode.CodeGroupK": 10601 }) });
```

### 3.3 XML body

If `body_` is a `Document`, request method is `POST` and content type is XML.
This is heavily used for batch operations and structured DB CRUD payloads.

### 3.4 JSON body

If `body_` is a plain object, request method is `POST` and content type is JSON.

## 4. Common Arguments Used Against Atomic Endpoints

- `query`: named statement (often with `#` prefix) or raw SQL
- `values`: JSON object used for placeholders
- `record`: JSON object for generic CRUD (`table`, `values`, `where`, `returning`)
- `table`: target table name
- `columns`: JSON array for column/row scope in named query paths
- `modifiers`: JSON object for order/limit/filter behavior
- `mode=bulk`: used for bulk insert in vote casting
- `ui=1`: requests UI metadata in select response
- `echo=<tag>`: labels results in multi-command flows
- `debug=true`: requests debug metadata in some list flows

## 5. Page to Endpoint Mapping

### 5.1 Public vote flow pages

#### `target/vote/page_cast.html`

- `!sys/client/ip`
  - gets client IP before vote check
- `!db/select` with `query=#cast-check_if_voted`
  - verifies if a client IP has already voted on the poll
- `!db/select?ui=1&` with queries:
  - `#cast-poll`
  - `#cast-poll_questions`
  - `#cast-poll_answers`
- `!db/insert` with `mode=bulk`, `table=TPollVote`, `query=cast-add_vote`
  - posts selected answers in one request

#### `target/vote/page_cast_result.html`

Uses one `!xml` batch containing `db/select` commands for:

- `cast-poll`
- `cast-poll_questions`
- `cast-poll_answers_and_count`
- `tag-poll_get_tags`

#### `target/vote/page_cast_list.html`

- `!db/select?` with `query=#code-get_list` and area code group filter
- `!db/select` with `query=tag-selected` and XML body with repeated `<where>` tag keys
- `!db/select?` with `query=list-poll`, `modifiers`, optional XML filter body, optional `values`, and `debug=true`

### 5.2 Poll administration pages

#### `target/vote/page_poll_edit.html`

Uses both direct DB calls and `!xml` batches.

Select/list metadata:

- `code-get_list` (area/type/state)
- `vote-count_questions`
- `vote-poll_search`
- `vote-poll_get`
- `vote-poll_get_tags`
- `vote-link_get`

Poll CRUD via generic record payload:

- `!db/insert?` with `record={ table:"TPoll", values, returning:"PollK" }`
- `!db/update?` with `record={ table:"TPoll", values, where }`
- `!db/delete?` with `record={ table:"TPoll", where }`

Link CRUD via generic record payload:

- `!db/insert?` for `TLink`
- `!db/update?` for `TLink`
- `!db/delete?` for `TLink`

Tag relation updates/deletes via named queries in XML batch:

- `tag-add`
- `vote-poll_add_tag`
- `vote-poll_delete_tags`

#### `target/vote/page_poll_question_edit.html`

- `!db/select` with `query=#vote-get_first` (fallback when no PollK in URL)
- `!db/select` with `query=#vote-get` and `values={ PollK }`
- `!db/select` with `query=#vote-all_questions` and `values={ PollK }`
- `!db/update` with XML body for `TPoll`
- `!db/insert` with XML body for `TPollQuestion`
- `!db/update` with XML body for `TPollQuestion`
- `gd.DB.Insert/Update/Delete` wrappers for `TPollAnswer` that call:
  - `!db/insert`
  - `!db/update`
  - `!db/delete`

### 5.3 User/admin pages

#### `target/vote/page_user_login.html`

Uses `!xml` batch with one command:

- `db/select` query `user-login` with login/password values

#### `target/vote/page_user_register.html`

Uses `!xml` batch with two commands:

- `db/select` query `user-exists`
- `db/insert` query `user-register`

#### `target/vote/page_user_edit.html`

- `!db/select?` with `query=#user-edit_table`
- `!db/select?echo=user` with `query=#user-edit_search`
- `!db/insert?` with `record={ table:"TUser", values, returning:"UserK" }`
- `!db/update?` with `record={ table:"TUser", values, where }`
- `!db/delete?echo=user` with raw SQL delete + values

#### `target/vote/page_code.html`

Uses raw SQL through db endpoints:

- select groups (`!db/select`)
- select single group (`!db/select?`)
- insert group (`!db/insert?echo=user`)
- update group (`!db/update?echo=user`)
- delete group (`!db/delete?echo=user`)

### 5.4 Bootstrap/utility page

#### `target/vote/pages.html`

- `!sys/meta/query/count`
  - checks if query metadata is loaded on server
- references a function `SERVER_AddSqlQuery()` when count is zero

Important note:

- `SERVER_AddSqlQuery()` is referenced in `pages.html` but not defined in this workspace files.
- New developers should confirm where this function is provided at runtime (external script, template injection, or missing implementation).
- Without loading metadata queries, most named `query=...` calls in the app will fail.

## 6. Required Named Queries Observed In Frontend

The following names appear in active page logic and should exist in server metadata:

- `cast-check_if_voted`
- `cast-add_vote`
- `cast-poll`
- `cast-poll_questions`
- `cast-poll_answers`
- `cast-poll_answers_and_count`
- `code-get_list`
- `tag-selected`
- `list-poll`
- `tag-poll_get_tags`
- `vote-count_questions`
- `vote-poll_search`
- `vote-poll_get`
- `vote-poll_get_tags`
- `vote-link_get`
- `vote-poll_add_tag`
- `vote-poll_delete_tags`
- `tag-add`
- `vote-get_first`
- `vote-get`
- `vote-all_questions`
- `user-login`
- `user-exists`
- `user-register`
- `user-edit_table`
- `user-edit_search`

## 7. XML Batch Pattern Used By Frontend

The project uses XML command batching to reduce round-trips and coordinate related operations.

Typical pattern:

```xml
<commands>
  <command qs="db/select?query=user-login&values=..." />
  <command qs="db/insert?query=user-register&values=..." />
</commands>
```

The frontend expects server support for:

- processing each `qs` in order
- returning a result list where entries can be identified by attributes like `echo`

## 8. Failure Modes New Developers Should Know

- If query metadata is missing, named query calls (`query=#...` or `query=name`) fail immediately.
- If response format changes away from XML `<result>` payloads, many pages break because they parse `result.textContent` directly.
- If `sys/client/ip` is unavailable, vote eligibility checks in cast flow fail.
- If batch `xml` endpoint behavior changes, login/register and several admin flows break.

## 9. Practical Onboarding Checklist

1. Confirm atomic server exposes `db/*`, `sys/*`, and `xml` endpoints.
2. Confirm frontend base URL resolution in `gd.GetBaseUrl()` points to the server host/port.
3. Load query metadata before using pages with named statements.
4. Validate critical named queries listed in section 6.
5. Smoke test pages in this order:
   1. `pages.html` (meta query count)
   2. `page_user_register.html` and `page_user_login.html`
   3. `page_poll_edit.html`
   4. `page_poll_question_edit.html`
   5. `page_cast.html` and `page_cast_result.html`

This sequence verifies both bootstrap and end-user vote flows.
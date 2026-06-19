# Web Vote Server API

Short notes for developers based on the current HTML client usage in `target/vote` and the server notes in the HTTP server repo.

## Routing

- Client calls internal endpoints with a leading `!`, for example `!db/select`.
- On the server side these map to the internal API groups described in the HTTP server docs: `db/*`, `sys/*`, and `xml`.
- The client transport is implemented in `target/vote/js/gd_server.js`.

## Endpoints Used By The Frontend

### Database

- `!db/select` or `!db/select?`
- `!db/insert` or `!db/insert?`
- `!db/update` or `!db/update?`
- `!db/delete` or `!db/delete?`

Common query parameters used with these endpoints:

- `query=name`: execute a named server-side statement, for example `#cast-poll` or `user-edit_search`
- `values=<json>`: bind values for named statements or SQL placeholders
- `record=<json>`: CRUD payload, usually `{ table, values, where, returning }`
- `table=<name>`: table target, to inform table fields belongs to
- `columns=<json>`: requested output columns
- `modifiers=<json>`: paging, sort, and filter metadata
- `mode=bulk`: bulk insert mode
- `ui=1`: asks the server to include UI metadata in the XML result
- `echo=<tag>`: label a result block in multi-command responses
- `debug=true`: request extra debug data

### System

- `!sys/client/ip`: returns client IP, used before voting
- `!sys/meta/query/count`: returns number of loaded SQL metadata queries

### Batch XML

- `!xml`: execute multiple commands in one request
- Request body is XML, usually `<commands><command qs="..." /></commands>`
- Each `qs` attribute contains one internal call such as `db/select?query=user-login&...`

This is used for:

- login
- loading several poll-related datasets in one round-trip
- tag updates
- grouped delete operations

## Request Shapes

The client wrapper supports two main styles.

### 1. Query string style

Legacy string format is newline-separated `key=value` pairs. The wrapper URL-encodes each value.

```text
query=#cast-check_if_voted
values={"PollK":"...","FIp":"..."}
```

Equivalent URL:

```text
!db/select?query=%23cast-check_if_voted&values=%7B...%7D
```

### 2. Body style

- If the third argument is a plain object, the wrapper turns it into query parameters.
- If a `Document` is passed as the body, the request becomes `POST` with `Content-Type: application/xml`.
- If a plain object is passed as the body, the request becomes `POST` with `Content-Type: application/json`.

Example used for bulk voting:

```javascript
gd.Send(
	"!db/insert",
	{ mode: "bulk", table: "TPollVote", query: "cast-add_vote", values: JSON.stringify(oPoll) },
	oDocument
);
```

## Response Contract

`gd.Send()` and `gd.SendToServer()` return:

```javascript
{ format, data, status }
```

- `format` is `json`, `xml`, or `text`
- `status` is the HTTP status code
- `data` is the parsed response body

In the current app, most server calls return XML. The frontend usually reads one or more `<result>` nodes and then parses `result.textContent` as JSON.

Typical patterns:

- select: result text is a JSON table array
- insert/update/delete: result text often contains `{ count, key, abort, text }`
- batch xml: multiple `<result>` nodes, sometimes distinguished with `echo="..."`

## What The App Depends On

- Named SQL statements must already exist on the server for all `query=...` calls.
- XML batch execution must support `qs` attributes that embed internal endpoint calls.
- Database responses should keep the current XML `<result>` format, otherwise the existing pages break.
- Voting depends on `!sys/client/ip` and the `cast-add_vote` / `cast-check_if_voted` queries.

## Main Frontend Usage Areas

- poll CRUD and tag/link management
- poll question and answer editing
- vote casting and result pages
- user CRUD and login
- poll list filtering and metadata loading

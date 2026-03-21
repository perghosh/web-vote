# JavaScript Library Files

Shared utility and UI classes used by the vote application.

## Table of Contents

- [JavaScript Library Files](#javascript-library-files)
  - [Table of Contents](#table-of-contents)
  - [Quick Reference](#quick-reference)
  - [Data attributes used in html pages](#data-attributes-used-in-html-pages)
  - [gd\_browser.js](#gd_browserjs)
  - [gd\_data\_table.js](#gd_data_tablejs)
  - [gd\_db.js](#gd_dbjs)
  - [gd\_mapper.js](#gd_mapperjs)
  - [gd\_ui\_draggable.js](#gd_ui_draggablejs)
  - [gd\_ui\_tablelite.js](#gd_ui_tablelitejs)
  - [gd\_ui\_tabs.js](#gd_ui_tabsjs)
  - [gd\_ui\_toast.js](#gd_ui_toastjs)
  - [gd\_ui\_tree\_temp.js](#gd_ui_tree_tempjs)

---

## Quick Reference

| File | Class / Namespace | Purpose |
|------|-------------------|---------|
| `gd_browser.js` | `gd` (namespace) | URL encoding, base64, `SendToServer()` fetch wrapper |
| `gd_data_table.js` | `Table` | Row/column data structure with sort, find, clone, export |
| `gd_db.js` | `DBRecord` | Schema-based record with key columns, read/write callbacks |
| `gd_mapper.js` | `gd_mapper` (namespace) | Parse XML/CDATA responses into JS arrays/values |
| `gd_ui_draggable.js` | `UIDraggable` | Drag-and-drop positioning for any element |
| `gd_ui_tablelite.js` | `UITableLite` | Render a `Table` as an HTML `<table>` with callbacks |
| `gd_ui_tabs.js` | `UITabControl` | Tab switching logic, caller supplies all CSS |
| `gd_ui_toast.js` | `UIToast` | Positioned toast popups with progress bar |
| `gd_ui_tree_temp.js` | `UITree` | Hierarchical tree with lazy loading and selection |

---

## Data attributes used in html pages

| Name | Description |
|------|-------------------|
| `data-section` | Type of section when page is divided in to different parts |
| `data-command` | command name and try to use this with event delecation, also make it descriptive what the command does. Do not try to be smart |
| `data-field` | Name of database field, use this to bind information from server, often database fields |
| `data-table` | Can be used if field need to know what table it belongs to |
| `data-comment` | When something need to be described for development |




---

## gd_browser.js

Browser-level utilities exposed on the global `gd` namespace. Handles base URL management, URL parameter encoding, base64 conversion, and server communication via `fetch`.

**Key functions:**

| Function | Description |
|----------|-------------|
| `SetBaseUrl(sBaseUrl)` | Set the default base URL used by `SendToServer` |
| `GetBaseUrl()` | Build base URL from `window.location` (protocol + host + port) |
| `EncodeUrlParams(sUrl)` | Parse and re-encode all query parameters in a URL string |
| `EncodeToBase64(sText)` | Convert a string to base64, handles Unicode via UTF-8 encoding |
| `SendToServer(sBaseUrl, sEndpoint, sArguments, sBody)` | Send a GET/POST request; auto-parses JSON, XML, or text responses |

`SendToServer` accepts newline-separated `key=value` argument pairs, encodes them, and returns a promise resolving to `{ type, data }`.

---

## gd_data_table.js

The `Table` class manages in-memory tabular data with typed, named columns. Columns can have names, aliases, types, and alignment state. Rows are plain arrays matching the column order.

**Key methods:**

| Method | Description |
|--------|-------------|
| `GetColumnIndex(column)` | Find column index by name, alias, or object |
| `GetColumnCount()` | Return number of columns |
| `GetCell(iRow, column)` | Get cell value (column by index or name) |
| `GetCellValue(iRow, column)` | Get cell value with column resolution |
| `SetCellValue(iRow, column, value)` | Set cell value |
| `GetData(options)` | Retrieve data with optional sort, headers, or index column |
| `FindAll(find)` | Search rows using a function or match object |
| `Add(row)` | Add one or more rows |
| `Delete(position, length)` | Remove rows at position |
| `Clone(rows)` | Deep-copy the table or a subset of rows |
| `AsObject(iRow)` | Convert a row to a `{ columnName: value }` object |
| `AsString(iRow, separator)` | Convert a row to a delimited string |
| `AsXml(iRow, options)` | Serialize a row as XML |
| `AsJson(row, options)` | Serialize a row / table as JSON |
| `PrepareColumns()` | Auto-generate column definitions from the first data row |

---

## gd_db.js

The `DBRecord` class provides schema-based record management for database rows. Each column definition supports type, key flags, required flag, labels, validation patterns, and default values. Values are stored in a `Map` for O(1) lookup.

**Key methods:**

| Method | Description |
|--------|-------------|
| `AddValue(value)` | Bulk-add values from an object or array |
| `SetValue(name, value)` | Set one or multiple values |
| `GetValue(sName)` | Get value by column name |
| `GetAllValues()` | Get all values as a plain object |
| `GetFilledValues()` | Get non-empty values as an object |
| `ClearValues()` | Reset all values to null |
| `ReadValues(fnRead)` | Load values via a callback (e.g. from UI inputs) |
| `WriteValues(fnWrite)` | Write values via a callback (e.g. to UI inputs) |
| `GetKeyValue()` | Get the primary key value |
| `SetKeyValue(key)` | Set the primary key value |
| `HasKeyValue()` | Check if key column has a non-null value |
| `GetColumnNames()` | Get array of all column names |
| `AddColumn(column, map)` | Add new column(s) to the schema |
| `AsJson()` | Convert record to JSON object |

---

## gd_mapper.js

Namespace `gd_mapper` with helper functions for parsing XML server responses that contain JSON data inside CDATA sections.

**Key functions:**

| Function | Description |
|----------|-------------|
| `XML_GetFirstValue(xml, sNode)` | Extract the first value from the second row of a `<result>` node's JSON payload |
| `XML_GetFirstArray(xml, sNode)` | Extract the full array from the first `<result>` node's JSON payload |

Both functions accept either an XML string, an `XMLDocument`, or a response object with a `.data` property. They locate `<result>` nodes (optionally filtered by `command="select"`) and parse the CDATA JSON content.

---

## gd_ui_draggable.js

The `UIDraggable` class makes any HTML element movable via mouse or touch drag. It supports CSS transform or position-based movement, optional drag handles, boundary constraints, grid snapping, and drag event callbacks.

**Constructor options:**

| Option | Description |
|--------|-------------|
| `bUseTransform` | Use CSS `transform` instead of `top`/`left` (default: `true`) |
| `sHandleSelector` | CSS selector for a drag handle within the element |
| `eHandle` | Specific element to use as drag handle |
| `oBounds` | Constrain movement within a bounding element with optional padding |
| `bSnapToGrid` / `iGridSize` | Enable grid snapping at a given pixel interval |
| `fnOnDragStart` / `fnOnDragMove` / `fnOnDragEnd` | Lifecycle callbacks |

---

## gd_ui_tablelite.js

The `UITableLite` class renders a `Table` instance as an HTML `<table>` element inside a parent container. It supports column selection, row/cell callbacks for custom rendering, CSS class injection, sorting, and row indexing.

**Key methods:**

| Method | Description |
|--------|-------------|
| `Render(oTable)` | Build or rebuild the HTML table from data |
| `Update()` | Refresh table content from the source `Table` |
| `SetColumns(columns)` | Change which columns are displayed |
| `Destroy()` | Remove the table from the DOM |

**Callback commands** (via `aCallback` option): `"row"`, `"cell"`, `"row_class"`, `"cell_class"` — each receives contextual data and can return custom content or CSS classes.

---

## gd_ui_tabs.js

The `UITabControl` class provides tab-switching logic without any built-in CSS. The caller is fully responsible for styling visibility, active states, and layout through the class names passed in the `style` option.

**Key methods:**

| Method | Description |
|--------|-------------|
| `AddTab(sTitle, eContent)` | Add a new tab with a title and content element |
| `SetActive(iIndex)` | Switch to a tab by index |
| `Destroy()` | Clean up DOM and event listeners |

**Required CSS:** The caller must define `display: none` for panels and `display: block` for the active panel class.

---

## gd_ui_toast.js

The `UIToast` class creates animated notification popups. Toasts support six screen positions, semantic type styling (success, danger, warning, etc.), stacking with a max limit, auto-dismiss with a progress bar, and an optional close button.

**Key methods:**

| Method | Description |
|--------|-------------|
| `Show(sMessage, oOptions)` | Display a toast with optional type, duration, and close button |

**Positions:** `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`
**Types:** `primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark`

---

## gd_ui_tree_temp.js

The `UITree` class renders a multi-root hierarchical tree control designed for database table relationships. Each node can store metadata (table name, record ID) and children can be loaded lazily via a callback.

**Key methods:**

| Method | Description |
|--------|-------------|
| `AddRoot(oNode)` | Add a root-level node |
| `AddChild(sParentId, oNode)` | Add a child node under a parent |
| `Expand(sId)` / `Collapse(sId)` | Toggle node visibility |

**Callback events:** `select`, `expand`, `collapse`, `lazyload` — enabling on-demand data fetching for large hierarchies.

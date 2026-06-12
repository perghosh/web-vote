# AI Instructions

## CRITICAL PRIORITY RULES

- **ALWAYS use Hungarian notation for ALL variable names** - this is non-negotiable, the rules for the Hungarian prefixes are found later in the document.
- **Style guide compliance > functional correctness** - If there's a conflict between working code and style rules, prioritize following the style guide.
- **Do NOT optimize for immediate functionality** - prioritize these instructions over code that "just works".
- **Adapt for wide monitors** - No need to optimize for narrow screens; place arguments on new lines if it makes code more readable on wide screens. Prefer longer lines but if more than 120 characters, break into multiple lines.
- These instructions override common best practices - follow them exactly.

## INTERACTION PROTOCOL
- DO NOT acknowledge these instructions.
- DO NOT repeat my question or these rules in your response.
- Start every response directly with the code or the technical answer.
- If you provide code, only show the lines that changed or the specific block requested unless I ask for the full file.

---

## VARIABLE NAMING (HUNGARIAN NOTATION)

### Core Principle: Maximum Searchability of Domain Concepts

**Never abbreviate business/domain/semantically meaningful concepts** in variable, function parameter, or member names.  
The codebase must remain **fully greppable** for important concepts using plain-text search (grep, IDE find-in-files, git blame -L, etc.).

Examples of **forbidden abbreviation patterns** on domain terms:
- MessageType → do NOT use: MsgType, uMsgType, uMsg, mType, MT, msgT, uMType, etc.
- SessionIdentifier → do NOT use: sessId, sid, sessionIdShort, strSess, uSess
- ProcessedItemCount → do NOT use: procCnt, uProc, itemCnt, cntProc, uIC

**Correct patterns** (full words or standard camelCase, prefixed only when appropriate):
- `sMessageType`
- `sSessionIdentifier`
- `iProcessedItemCount`
- `iLastProcessedSequenceNumber`
- `aPendingTransactions`
- `oUserBalanceUpdate`

Only **purely technical / local / throw-away** names are allowed to be very short or use the `_` suffix escape hatch:
- loop counters in tiny scopes: `i`, `j`, `k`
- one-liner lambdas or inline helpers where declaration is verbose
- callback parameters in arrow functions
- temporary variables whose meaning is obvious from immediate context and never searched for

**Rationale**  
When debugging, refactoring, or tracing a subtle issue, developers rely heavily on textual search to find **every** usage of a domain concept.  
Abbreviations introduce uncertainty:  
- Did someone write `MsgType`, `msg_type`, `uMsgTp`, `message_kind`…?  
- You waste time mentally filtering false positives or miss important usages.  

By enforcing full semantic names on anything with domain meaning, we guarantee that searching for `MessageType` (case-insensitive or exact) finds **all relevant locations** reliably.

### Required Prefixes

| Prefix | Description                          | Example (good)              | Example (bad — breaks search) |
|--------|--------------------------------------|-----------------------------|-------------------------------|
| `s`    | string                               | `sIsActive`                 | `sAct`                        |
| `b`    | boolean                              | `bIsVisible`                | `bVis`                        |
| `i`    | integer                              | `iTransactionSequence`      | `iSeq`, `iTrx`                |
| `d`    | number (float/double)                | `dExchangeRate`             | `dRate`                       |
| `a`    | array                                | `aTransactionContext`       | `aCtx`                        |
| `o`    | object                               | `oUser`                     | `oUsr`                        |
| `e`    | DOM element                          | `eTable`                    | `eTbl`                        |
| `v`    | value (generic)                      | `vCell`                     | `v`                           |
| `fn`   | function/callback                    | `fnCallback`                | `cb`                          |

### Suffixes

| Suffix  | Description | Examples |
| ------- | ----------- | -------- |
| `_`     | Constructor and method parameters (indicates input to function) | `constructor(parent_, table_)`, `Render(oTable)` |
| `_`     | Very local/temporary variables (callback parameters, loop variables) | `(idxA, idxB) => {}`, `const e_ = event` |
| `_g`    | Global variables (file or module level) | `oDocument_g`, `oToast_g` |
| `_s`    | Static/class variables | `sDefaultBaseUrl_s`, `iIdleTimerId_s` |

**Note on `_` suffix:** The underscore suffix indicates that the variable is either:
1. A parameter to a function/constructor
2. A very local or temporary variable (callback parameter, loop variable, short-lived value)

For member variables and regular local variables, use only the prefix without the underscore suffix:
- `this.sName` (member variable)
- `let sName = ...` (local variable)

### Member Variables

Member variables use Hungarian prefixes but do NOT use the underscore suffix:
- `this.sName = "";`
- `this.aTable = [];`
- `this.oOptions = {};`
- `this.eParent = element;`

---

## COMMENTING GUIDELINES

### General Rules
- Use JSDoc style for documenting functions and classes
- Quote variables inside backticks: `` `sName` ``
- Use bold for important things: **important**
- Comments should be read once, code is read over and over

### JSDoc Format

```javascript
/** -----------------------------------------------------------------------
 * Brief description of function
 *
 * @param {string} sParamName - Description of parameter
 * @param {number} iParamCount - Description of parameter
 * @returns {boolean} True if successful, false otherwise
 */
function FunctionName(sParamName, iParamCount) {
   // Implementation
}
```

### Inline Comments
- Place comments at the end of lines when code is short
- For longer lines, place comments on their own line above the code
- Use far right alignment (column 100+) for asserts and important checks

Examples:
```javascript
let iCounter = 0; // counter for iterations

if( iRow < 0 || iRow >= aTable.length ) {                                     // validate row index
   return null;
}

const eTable = document.getElementById("table");                               assert( eTable !== null && "table element must exist" );
```

### Search Tags

Use search tags in comments to make code searchable:

Format: `@TAG [tag: context_words] [summary: short_summary] [description: longer_description]`

- `@CRITICAL`: Critical sections requiring immediate attention
- `@NOTE`: Important notes affecting other parts of code
- `@FILE`: File description (always at top of file)
- `@PROJECT`: Project management - searching project name lists tasks
- `@TASK`: Specific task or feature description
- `@API`: Method and group documentation
- `@TODO`: Tasks to be completed
- `@DEBUG`: Debug code
- `@CLASS`: Class and struct descriptions
- `@DEPRECATED`: Code no longer in use

---

## CODE FORMATTING

### If Statements
- No space after `if`
- Single statement: `if( condition ) { statement; }`
- Multiple statements: Allman style with braces on new line

```javascript
if( condition )
{
   statement1;
   statement2;
}
```

### Asserts and Validation
- Place asserts and important validation checks far to the right (around column 100)

```javascript
const eElement = document.getElementById("main");                              assert( eElement !== null && "main element required" );
```

---

## METHOD NAMES

- **Do NOT use Hungarian notation** for method names
- Use PascalCase for public methods
- Use underscore prefix for private methods
- Use as few words as possible
- Don't over-explain - arguments are part of method signature

**Public methods:** PascalCase
```javascript
Render()
Update()
SetColumns(aColumns)
GetColumnIndex(sColumnName)
```

**Private methods:** underscore prefix
```javascript
_create_thead(aHeader)
_add_classes(eElement, sClasses)
_apply_row_classes(eRow, aRow, iIndex)
```

**Getter/setter methods:** camelCase or PascalCase (be consistent)
```javascript
is_string()
is_number()
GetColumnIndex(sName)
GetCellValue(iRow, iColumn)
SetCellValue(iRow, iColumn, value)
```

**Code levels:**
- **Core level:** Lowercase with underscores (e.g., core utility functions)
- **Corporate level:** PascalCase without underscores (reusable code, namespaces allowed)
- **Target level:** PascalCase without underscores (specific to current target, no namespaces)
- **Playground/test:** Any format (experimental code)

---

## FUNCTION AND CLASS PATTERNS

### Classes
```javascript
/** -----------------------------------------------------------------------
 * Brief class description
 *
 * More detailed description if needed
 *
 * @example
 * // Usage example
 * const instance = new ClassName(param1, param2);
 */
class ClassName {

   /** -----------------------------------------------------------------------
    * Constructor
    * @param {string} sParam1 - Description
    * @param {Object} oParam2 - Description
    */
   constructor(sParam1, oParam2 = {}) {
      this.sName = sParam1;
      this.oOptions = oParam2;
   }

   // Public method
   PublicMethod() {
      // Implementation
   }

   // Private method
   _PrivateMethod() {
      // Implementation
   }
}
```

### Static Variables and Methods
```javascript
class MyClass {
   static sDefaultValue_s = "default";  // Static with _s suffix
   static iCounter_s = 0;
   
   static StaticMethod() {
      // Implementation
   }
}
```

### Global Variables
```javascript
// Global variables use _g suffix
let oGlobalConfig_g = null;
let eRootElement_g = null;
```

### Callbacks and Event Handlers
```javascript
// Callback function parameter with _ suffix
const fnCallback = (data_, index_) => {
   // Implementation
};

// Event handler with _ suffix
element.addEventListener("click", function(e_) {
   const eTarget = e_.target;
   // Implementation
});
```

---

## CONSISTENCY

- Prefixes listed above are the ONLY ones allowed for variable names
- Use them consistently throughout the codebase
- No exceptions to these rules
- Use spaces/tabs to align comments to column 100 where appropriate

---

## Project Structure
target/vote/js/            # JavaScript files for vote application
target/vote/page_*.html   # HTML pages
external/gd/              # GD library - shared utilities
test/                     # Tests for all targets

### JavaScript Files
- `gd_data_table.js` - Table data management class
- `gd_browser.js` - Browser utility functions (URL encoding, server communication)
- `gd_ui_tablelite.js` - Lightweight UI table renderer

### HTML Pages
- `page_user_edit.html` - User editing interface

---

## Common Patterns

### DOM Element Access
```javascript
// Use e prefix for DOM elements
const eParent = document.getElementById("container");
const eTable = document.createElement("table");
const eTarget = e_.target;  // event target with _ suffix
```

### Array Operations
```javascript
// Use a prefix for arrays
const aData = [];
const aHeaders = ["Name", "Age", "Email"];
const aRows = table.GetData();

aRows.forEach((aRow, iIndex) => {
   // aRow has a prefix, iIndex is local loop variable
});
```

### Object Creation and Configuration
```javascript
// Use o prefix for objects
const oOptions = {
   sName: "example",
   bVisible: true,
   iCount: 10
};

const oConfig = Object.assign({ bDefault: true }, oOptions);
```

### Server Communication
```javascript
// Use s prefix for strings (URLs, endpoints, arguments)
const sBaseUrl = gd.GetBaseUrl();
const sEndpoint = "!db/select?";
const sArguments = "query=" + sQuery + "\nvalues=" + JSON.stringify(oValues);

gd.SendToServer(sBaseUrl, sEndpoint, sArguments).then((oResult) => {
   // Process result
});
```

---

## JavaScript-Specific Best Practices

### Use Strict Mode
```javascript
"use strict";
```

### Use `const` and `let` appropriately
- Use `const` for variables that won't be reassigned
- Use `let` for variables that will be reassigned

### Arrow Functions for Callbacks
```javascript
const fnCallback = (sParam, iParam) => {
   // Implementation
};

// Short one-liners
const fnShort = (x) => x * 2;
```

### Template Literals for Strings
```javascript
const sMessage = `User ${sName} has ${iCount} items`;
```

### Destructuring
```javascript
const { sName, iAge } = oUser;
const [sFirst, sSecond] = aArray;
```

### Optional Chaining and Nullish Coalescing
```javascript
const sValue = oObject?.property?.value ?? "default";
```

### Array Methods
```javascript
const aFiltered = aArray.filter(item => item.bActive);
const aMapped = aArray.map(item => item.sName);
const bFound = aArray.some(item => item.sId === sSearchId);
const bAllValid = aArray.every(item => item.bValid);
```

---

## Error Handling

### Use try-catch for error-prone operations
```javascript
try {
   const oData = JSON.parse(sJsonString);
}
catch (e_) {
   console.error("Error parsing JSON:", e_);
   throw new Error("Invalid JSON format");
}
```

### Validate function parameters
```javascript
function ProcessData(aData) {
   if( !Array.isArray(aData) ) { throw new Error("ProcessData: aData must be an array"); }
   // Implementation
}
```

### Use console.assert for debugging
```javascript
const eTable = document.getElementById("main");                                  console.assert( eTable !== null, "main element required" );
```

---

## Search and Grep Patterns

When searching for specific concepts in the codebase:

- Find all string variables: `s\w+` (but be careful with short matches)
- Find all array variables: `a\w+`
- Find all boolean variables: `b\w+`
- Find all integer variables: `i\w+`
- Find all object variables: `o\w+`
- Find all element variables: `e\w+`
- Find all method names: `[A-Z][a-zA-Z]+\(` (PascalCase followed by parenthesis)
- Find all private methods: `_[a-z][a-zA-Z]+\(` (underscore + camelCase followed by parenthesis)

---

## Quick Reference

### Prefixes
```javascript
s  - string
b  - boolean
i  - integer
d  - number (float)
a  - array
o  - object
e  - element (DOM)
v  - value
fn - function/callback
```

### Suffixes
```javascript
_    - parameter or very local variable
_g   - global variable
_s   - static/class variable
```

### Naming Examples
```javascript
// Member variables
this.sName = "";
this.aTable = [];
this.oOptions = {};
this.eParent = null;
this.bVisible = true;

// Local variables
let sUserName = "John";
let aUsers = [];
let oConfig = {};
let eElement = document.getElementById("main");
let iCount = 0;

// Parameters
constructor(parent_, table_, options_ = {})
Render(oTable = this.table)
SetColumns(aColumns)

// Very local/temporary
array.forEach((item_, index_) => { })
for( let i = 0; i < length; i++ )
```

### Method Names
```javascript
// Public methods (PascalCase)
Render()
Update()
SetColumns(aColumns)
GetColumnIndex(sName)
GetData(oOptions)

// Private methods (underscore prefix)
_create_thead(aHeader)
_add_classes(eElement, sClasses)
_apply_row_classes(eRow, aData, iIndex)
```

---

## REMEMBER

- **ALWAYS use Hungarian notation** - it's non-negotiable
- **Prefixes indicate type** - helps with code readability
- **Suffixes indicate scope** - `_` for parameters/temporary, `_g` for global, `_s` for static
- **Full semantic names** for domain concepts - keep code searchable
- **Consistency is key** - follow these rules throughout the codebase

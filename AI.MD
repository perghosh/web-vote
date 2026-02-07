## Javascript style guide

Hungarian like style guide
Numbers that are integers, prefix with 'i'
Numbers that are decimals, prefix with 'd'
Strings prefix with 's'
Booleans prefix with 'b'
Arrays prefix with 'a'
Objects prefix with 'o'
Functions prefix with 'f'

Variables similar to any or any ends with underscore

```js
// Example usage:
const iNumber = 42;
const dNumber = 3.14;
const sString = "Hello";
const bBoolean = true;
const aArray = [1, 2, 3];
const oObject = { key: "value" };
const fFunction = () => console.log("Hello");


let value_ = 10; // "Any" variable
value_ = "Hello";
value_ = true;
```

## Statements

Use brackets even if only one statement is present like this:
if(condition) { statement; }
And do not wrap for multiple lines if only one statement is present and the line is not very long. No problem if row is up to 120 characters.
Do not place space between if and condition.
if(condition) { statement; } <-- This is correct.

## Comments
Try to comment all variables. This comment can be placed directly after variable declaration.
const bBoolean = true; // Boolean variable

Lines that are commented then start the comment at column 80
if( typeof value_ === "string") {                                              // if value are string then ...
   ...
}

When commenting describes next section use markdown syntax.
// ## Process value if it is a string .........................................
if( typeof value_ === "string") {                                              // if value are string then ...
   // ### value is string
   ...
}

In the above sample two ## marks that this is for multiple rows and dotted line to separate sections.
Subsection for this comment have three ### but no dotted line, if more subsecions are needed that
belongs to another subsection then increase the number of ### marks.
#### value is string
##### value is string
###### value is string.

## Method comment
Use jsdoc to document methods. and place line to mark that method is easy fo find when scanning code.
/** ---------------------------------------------------------------------------
 * Update UI elements
 * @param {string} sType - Type of update
 */
function PAGE_Update( sType ) {
}

Method naming use CamelCase like ThisIsAMethod. Methods that are hardcoded for a specific area
have the area name in uppercase before method name like AI_MethodName or PAGE_MethodName.

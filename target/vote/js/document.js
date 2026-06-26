/* 
Method Documentation:
=========================
CDocument - Page-level data cache and state container for key-value pairs, DOM elements, records, and tables with O(1) lookup by id and convenience lookup by name. IDs are auto-generated if not provided.
XML_GetFirstValue - Extracts the first value from the second row of an XML result node, with support for CDATA JSON parsing and error handling for missing nodes or invalid structure.   
XML_GetFirstArray - Extracts an array of values from the first result node in an XML document, with error handling for missing nodes or invalid CDATA structure.
XML_AppendElement - Appends an XML element with specified attributes and optional value to a parent element, with error handling for invalid input.
XML_AppendObject - Appends an object as a new node to an XML document, handling both primitive and complex values as attributes or child elements, with error handling for invalid input.
FIELD_CopyValues - Copies field values from a source element or object to a target element, with optional filtering by field names and error handling for invalid input.
THEME_Select - Selects and applies a theme based on a given name, with support for persistence in localStorage, configurable theme options, and error handling for unknown themes.

*/

/** ---------------------------------------------------------------------------
 * CDocument — Page-level data cache and state container.
 *
 * Manages global key-value data, lazy DOM element references, database records
 * and UI table instances. Records and tables are stored in Maps keyed by a
 * unique id, enabling O(1) lookup by id. Lookup by table/name name is also
 * supported as a convenience for the common single-entry case.
 *
 * IDs are auto-generated via crypto.randomUUID() if not provided, and are
 * written back onto the object as sId so callers can always retrieve them.
 *
 * @example
 * const oDoc = new CDocument();
 *
 * // --- Key-value store
 * oDoc.SetValue( "activeUserId", 42 );
 * oDoc.GetValue( "activeUserId" );                    // 42
 *
 * // --- Records: single entry per table (common case)
 * oDoc.AddRecord({ table: "user", name: "Alice" });
 * oDoc.GetRecord( "user" );                           // { table: "user", name: "Alice", sId: "..." }
 *
 * // --- Records: multiple entries, tracked by id
 * const sIdA = oDoc.AddRecord({ table: "order", amount: 100 });
 * const sIdB = oDoc.AddRecord({ table: "order", amount: 200 });
 * oDoc.GetRecord( "order" );                          // First match — { amount: 100, ... }
 * oDoc.GetRecordById( sIdB );                         // Exact match — { amount: 200, ... }
 *
 * // --- Records: supply your own stable id
 * oDoc.AddRecord({ table: "product" }, "product-main");
 * oDoc.GetRecordById( "product-main" );
 *
 * // --- Tables follow the same pattern
 * const sIdT = oDoc.AddTable({ name: "invoice", oInstance: oMyTable });
 * oDoc.GetTable( "invoice" );                         // First match by name
 * oDoc.GetTableById( sIdT );                          // Exact match by id
 *
 * // --- DOM elements are queried once and cached
 * oDoc.GetElement( "header" );                        // data-section="header"
 * oDoc.GetElement( "nav", "component" );              // data-component="nav"
 */
class CDocument {

   static iIdleTimerId_s = null; // Global timer ID for idle callback

   constructor( oOptions = {} ) {
      const oDefault = { bModified: false, oValues: {}, oElement: {}, mapRecord: new Map(), mapTable: new Map() };
      const o_       = Object.assign( oDefault, oOptions );

      this.bModified = o_.bModified; // Tracks whether document data has unsaved changes
      this.oValues   = o_.oValues;   // General-purpose key-value store for page-level data
      this.oElement  = o_.oElement;  // Cache for DOM element references
      this.mapRecord = new Map();    // Map<sId, record> — multiple entries per table name allowed
      this.mapTable  = new Map();    // Map<sId, table>  — multiple entries per table name allowed

      // ## Accept either a Map (used directly) or an Array (added via internal methods so sId is assigned)
      if( o_.mapRecord instanceof Map )        { this.mapRecord = o_.mapRecord; }
      else if( Array.isArray( o_.mapRecord ) ) { o_.mapRecord.forEach( o_ => this.AddRecord( o_ ) ); }

      if( o_.mapTable instanceof Map )         { this.mapTable = o_.mapTable; }
      else if( Array.isArray( o_.mapTable ) )  { o_.mapTable.forEach( o_ => this.AddTable( o_ ) ); }
   }

   // Get global value by name -----------------------------------------------
   GetValue( sName ) { return this.oValues[sName]; }

   // Set global value by name -----------------------------------------------
   SetValue( sName, value_ ) { this.oValues[sName] = value_; }

   // Remove global value by name --------------------------------------------
   RemoveValue( sName ) { delete this.oValues[sName]; }

   // Add to array -----------------------------------------------------------
   AddToArray( sName, value_ ) {
      if( !Array.isArray(this.oValues[sName]) ) { this.oValues[sName] = []; }
      this.oValues[sName].push(value_);
   }

   // Remove from array ------------------------------------------------------
   RemoveFromArray( sName, value_ ) {
      if( !Array.isArray(this.oValues[sName]) ) { return; }
      const iIndex = this.oValues[sName].indexOf(value_);
      if( iIndex > -1 ) { this.oValues[sName].splice(iIndex, 1); }
   }

   // Merge global value by name without replacing existing values -----------
   MergeValue( sName, value_ ) {
      const vExisting = this.oValues[sName];

      // If no value exists yet, store incoming value directly
      if( vExisting === undefined ) { this.oValues[sName] = value_; return this.oValues[sName]; }

      // Merge arrays by appending only missing items
      if( Array.isArray(vExisting) && Array.isArray(value_) ) {
         value_.forEach( vItem_ => {
            if( vExisting.includes(vItem_) === false ) { vExisting.push(vItem_); }
         });
         return vExisting;
      }

      // Merge plain objects by adding only missing keys
      if( vExisting !== null && value_ !== null && typeof vExisting === "object" && typeof value_ === "object" && Array.isArray(vExisting) === false && Array.isArray(value_) === false ) {
         Object.keys(value_).forEach( sKey_ => {
            if( Object.prototype.hasOwnProperty.call(vExisting, sKey_) === false ) { vExisting[sKey_] = value_[sKey_]; }
         });
         return vExisting;
      }

      // Primitive or incompatible types: keep existing value (no replace)
      return vExisting;
   }

   // Check if document has unsaved changes ----------------------------------
   IsModified() { return this.bModified; }

   // Set modified flag ------------------------------------------------------
   SetModified( bModified ) { this.bModified = bModified; }

   // Get DOM element by name, lazy-queried and cached -----------------------
   GetElement( sName, sSelector = "section" ) {
      if( !this.oElement[sName] ) { this.oElement[sName] = document.querySelector(`[data-${sSelector}="${sName}"]`); }
      let eElement = this.oElement[sName];                                                         console.assert( eElement, `Element with data-${sSelector}="${sName}" not found` );
      return eElement;
   }

   // Add a record, returns the id -------------------------------------------
   AddRecord( oRecord, sId = null ) {
      if( !sId ) { sId = CDocument.GenerateUUID(); }  
      oRecord.sId = sId;
      this.mapRecord.set( sId, oRecord );
      return sId;
   }

   // Check if at least one record exists for the table name -----------------
   HasRecord( sTable ) { return [ ...this.mapRecord.values() ].some( o_ => o_.table === sTable ); }

   // Get first record matching the table name (common single-entry case) ----
   GetRecord( sTable ) {
      let oRecord = [ ...this.mapRecord.values() ].find( o_ => o_.table === sTable );              console.assert( oRecord, `No record found for table "${sTable}"` );
      return oRecord ?? null;
   }

   // Return all records matching the table name ------------------------------
   GetRecords( sTable ) {
      let aRecord = [ ...this.mapRecord.values() ].filter( o_ => o_.table === sTable );            console.assert( aRecord.length > 0, `No records found for table "${sTable}"` );
      return aRecord;
   }

   // Get exact record by id -------------------------------------------------
   GetRecordById( sId ) {
      let oRecord = this.mapRecord.get( sId );                                                     console.assert( oRecord, `No record found with id "${sId}"` );
      return oRecord ?? null;
   }

   // Add a table, returns the id --------------------------------------------
   AddTable( oTable, sId = null ) {
      if( !sId ) { sId = CDocument.GenerateUUID(); }  
      oTable.id = sId;
      this.mapTable.set( sId, oTable );
      return sId;
   }

   // Check if at least one table exists with the given name -----------------
   HasTable( sName ) { return [ ...this.mapTable.values() ].some( o_ => o_.name === sName ); }

   // Get first table matching the name (common single-entry case) -----------
   GetTable( sName ) {
      let oTable = [ ...this.mapTable.values() ].find( o_ => o_.name === sName );                  console.assert( oTable, `No table found with name "${sName}"` );
      return oTable ?? null;
   }

   // Return all tables matching the name -----------------------------------
   GetTables( sName ) {
      let aTable = [ ...this.mapTable.values() ].filter( o_ => o_.name === sName );                console.assert( aTable.length > 0, `No tables found with name "${sName}"` );
      return aTable;
   }

   // Get exact table by id --------------------------------------------------
   GetTableById( sId ) {
      let oTable = this.mapTable.get( sId );                                                       console.assert( oTable, `No table found with id "${sId}"` );
      return oTable ?? null;
   }

   // Remove table -----------------------------------------------------------
   RemoveTable( sName ) {
      const oTable = this.GetTable(sName);
      if(oTable) { this.mapTable.delete(oTable.id); }
      else { console.warn( `No table found with name "${sName}" to remove` ); }
   }

   // Generate a UUID that works in both HTTP and HTTPS -----------------------
   static GenerateUUID() {
      // Try crypto.randomUUID() first (secure contexts)
      if(typeof crypto !== 'undefined' && crypto.randomUUID) {
         try { return crypto.randomUUID(); } 
         catch(e) {}
      }
      
      // Fallback: RFC4122 version 4 compliant UUID
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
         const r = Math.random() * 16 | 0;
         const v = c === 'x' ? r : (r & 0x3 | 0x8);
         return v.toString(16);
      });
   }   
}

/** --------------------------------------------------------------------------- XML_GetFirstValue
 * Extract first value from second row in XML result. If only one result
 * node found then select that, if more than one then select first with
 * command="select". Throws if no matching node or invalid CDATA structure.
 *
 * @param {string} xml_ - XML string with result nodes containing CDATA JSON
 * @param {string} sNode - The name of the result node to select
 * @param {string} sType - Optional type for custom retrieval logic
 * @param {string} sEcho - Optional echo string for custom retrieval logic
 * @returns {any|null} First value from second row, or null if fewer than two rows
 */
function XML_GetFirstValue(xml_ , sNode = "result", sType = "", sEcho = "") {
   let oDocument;

   if( typeof xml_ === "object" ) { xml_ = xml_.data; }                       // If input is an object (e.g. server response), extract the XML string from the 'data' property

   // ## check if xml_ isn't xml object, then try to parse it as XML string

   let aResultNodes; // array with result nodes matching sNode name
   if( typeof xml_ === "string" ) {
      // ## Parse XML string and select result node
      const sXmlString = String(xml_); // Ensure it is string
      const oParser = new DOMParser(); // Create a DOMParser
      oDocument = oParser.parseFromString(sXmlString, "application/xml");     // Parse the XML string into a document
      aResultNodes = oDocument.querySelectorAll(sNode);                       // Select all nodes matching the specified name (default "result")
   }
   else if( xml_ instanceof Document ) {                                      // If xml_ is document then no need to parse
      oDocument = xml_; // Use the provided XML Document
      if(sEcho) {
         // Custom logic to select nodes based on sEcho value, for example:
         aResultNodes = oDocument.querySelectorAll(`${sNode}[echo="${sEcho}"]`);
      }
      else {
         aResultNodes = oDocument.querySelectorAll(sNode); // Select all nodes matching the specified name (default "result")
      }
   }
   else { throw new Error("Invalid XML input"); }

   if( !aResultNodes || aResultNodes.length === 0 ) { throw new Error("No result nodes found"); }

   // ## Select the first node
   let oNode = null; // First node value
   
   if( aResultNodes.length === 1 ) { oNode = aResultNodes[0]; }
   else if( aResultNodes.length > 1 ) { oNode = oDocument.querySelector(sNode + "[command='select']"); }

   if( !oNode ) { throw new Error("No result node with command='select' found"); }

   const bCData = oNode.firstChild?.nodeType === Node.CDATA_SECTION_NODE;     // Check if the first child of the node is a CDATA section

   let data_; // variable to hold first value data

   if( bCData === false ) { data_ = oNode.textContent; }                      // If not CDATA, use text content directly
   else {
      const sCData = oNode.textContent; // Extract CDATA content from the selected node, result is placed in cdata
      try { data_ = JSON.parse(sCData); }
      catch (oError) { throw new Error("CDATA is not valid JSON: " + oError.message); }
   }

   // ## Handle different formats of node content and try to pick the first value or first object

   if(sType === "object") { return data_; }                                   // If type is object, return the whole parsed object without trying to extract a value

   if(Array.isArray(data_) === true) {
      const aData = data_; // Only to make code simpler
      if(aData.length < 2 || !aData[1][0]) { return null; }
      else { return aData[1][0]; }                                            // Return the first value in the second row; it's wrapped as an array
   }
   else if(typeof data_ === 'object' && data_ !== null) {
      // It's an object, pick the first value
      const key_ = Object.keys(data_)[0];
      const value_ = data_[key_];
      if(value_ === undefined) { throw new Error("First value in object is undefined"); }
      return value_;
   }   

   return data_;
};


/** --------------------------------------------------------------------------- XML_GetFirstArray
 * Extract array of values from first result node. Throws if no matching node or invalid CDATA structure.
 *
 * @param {string|Document} xml_ - XML string or Document with result nodes containing CDATA JSON
 * @param {string} sNode - The name of the result node to select
 * @param {string} sEcho - Optional echo string for custom retrieval logic 
 * @returns {Array} Array of values from first result node, or empty array if no valid data found
 */
function XML_GetFirstArray(xml_ , sNode = "result", sEcho = "") {
   if( typeof xml_ === "object" && !(xml_ instanceof Document) && !(xml_ instanceof Element) ) { xml_ = xml_.data; }
   let aResultNodes;
   let oDocument;
   if( typeof xml_ === "string" ) {
      // ## Parse XML string and select result node
      const sXmlString = String(xml_);
      const oParser = new DOMParser();
      oDocument = oParser.parseFromString(sXmlString, "application/xml");
      aResultNodes = oDocument.querySelectorAll(sNode);
   }
   else if( xml_ instanceof Document || xml_ instanceof Element ) {
      oDocument = xml_;
      if(sEcho) {
         // Custom logic to select nodes based on sEcho value, for example:
         aResultNodes = oDocument.querySelectorAll(`${sNode}[echo="${sEcho}"]`);
      }
      else {
         aResultNodes = oDocument.querySelectorAll(sNode);
      }
   }
   else { throw new Error("Invalid XML input"); }

   if( !aResultNodes || aResultNodes.length === 0 ) { throw new Error("No result nodes found"); }

   // ## Select the first node

   let oNode = null;

   if( aResultNodes.length === 1 ) { oNode = aResultNodes[0]; }
   else if( aResultNodes.length > 1 ) { oNode = oDocument.querySelector(sNode + "[command='select']"); }

   if( !oNode ) { throw new Error("No result node with command='select' found"); }

   const sCData = oNode.textContent; // Extract CDATA content from the selected node, result is placed in cdata
   let aData; // Initialize variable to hold parsed JSON data
   try { aData = JSON.parse(sCData); }
   catch( oError ) { throw new Error("CDATA is not valid JSON: " + oError.message); }

   if( !Array.isArray(aData) ) { throw new Error("CDATA does not have expected array structure"); }

   return aData;
};

/** ---------------------------------------------------------------------------  XML_AppendElement
 * Append an element with attributes and optional value to a parent XML element.
 *
 * @param {Element} eParent - Parent XML element to append to (must be valid Element)
 * @param {Object} oValues - Object containing key-value pairs to set as XML attributes
 * @param {*} value_ - Optional value to set on a child value element (undefined = no child)
 * @param {string} sNode - Name of the child value element (default "value")
 * @returns {{ parent: Element, element: Element|null }} Parent element and created value element
 *
 * @example
 * // Append: <field name="title" type="text">Vote title</field>
 * const oParser = new DOMParser();
 * const oDocument = oParser.parseFromString("<values></values>", "application/xml");
 * const eValues = oDocument.documentElement;
 *
 * const oResult = XML_AppendElement(
 *    eValues,
 *    { name: "title", type: "text" },
 *    "Vote title",
 *    "field"
 * );
 *
 * console.log(oResult.element.outerHTML);
 */
function XML_AppendElement(eParent, oValues, value_, sNode = "value") {
   if(!(eParent instanceof Element)) { throw new Error("eParent must be a valid Element"); }

   const oDocument = eParent.ownerDocument;
   const eValue = oDocument.createElement(sNode);
   eParent.appendChild(eValue);

   // ## Set object values as attributes on the created element
   for(const [sKey, vValue] of Object.entries(oValues)) {
      if(vValue !== undefined && vValue !== null) { eValue.setAttribute(sKey, String(vValue));}
   }

   // ## Set value_ as text content if provided ..............................
   if(value_ !== null && value_ !== undefined) { eValue.textContent = String(value_);}

   return { parent: eParent, element: eValue };
}

/** --------------------------------------------------------------------------- XML_AppendObject
 * Append an object as a new node to an XML document. If document is null, a new one is created.
 *
 * Handles object values in two ways:
 * - If the object contains any complex values (objects or arrays), primitive values become attributes
 *   on the parent node, while complex values are added as child "field" elements with their name and
 *   JSON-stringified value as attributes.
 * - If the object contains only primitive values, all values are added as child "field" elements
 *   with name and value attributes.
 *
 * @param {Document|null} document_ - Existing XML document to append to
 * @param {Object} oValues - Object containing key-value pairs to be added to the XML
 * @param {string} sNode - Name of the parent node to create for the object (default "values")
 * @param {string} sField - Name of the attribute that holds the value (default "value")
 * @param {string} sRoot - Name of the root element when creating a new document (default "document")
 * @returns {{ document: Document, element: Element }} XML document and the created element node
 *
 * @example
 * // Create a new XML document and append one object
 * const [oDocument, eValues] = XML_AppendObject(
 *    null,
 *    {
 *       pollName: "Lunch choice",
 *       isActive: true,
 *       options: ["Pizza", "Salad", "Soup"]
 *    },
 *    "poll",
 *    "field",
 *    "document"
 * );
 *
 * console.log(oDocument.documentElement.outerHTML);
 * // Outputs: <document><poll pollName="Lunch choice" isActive="true"><field name="options" value="[&quot;Pizza&quot;,&quot;Salad&quot;,&quot;Soup&quot;]"></field></poll></document>
 *
 * @example
 * // Append another object into an existing values element
 * XML_AppendObject(eValues, { pollName: "Drink choice", isActive: false }, "poll", "field");
 */
function XML_AppendObject(document_, oValues, sNode = "values", sField = "value", sRoot = "document") {
   let oDocument; // XML Document to append to, created if null
   let eValues; // Element to where values are added

   // ## Create new XML document if null, otherwise use existing document
   if(document_ === null) {
      oDocument = document.implementation.createDocument("", "", null);
      const eRoot = oDocument.createElement(sRoot);
      oDocument.appendChild(eRoot);
   }
   // ## If Document provided, use it
   else if(document_ instanceof Document) { oDocument = document_; }
   // ## If Element provided, use its ownerDocument and treat element as values node
   else if(document_ instanceof Element) {
      eValues = document_;
      oDocument = document_.ownerDocument;
   }
   else { throw new Error("document_ must be null, Document, or Element"); }

   // ## Create new node for the object if not set
   if(!eValues) {
      eValues = oDocument.createElement(sNode);
      oDocument.documentElement.appendChild(eValues);
   }

   // ### Separate primitive and complex values
   const oChildField = {};
   const oFieldOrAttribute = {};
   let bHasChild = false;

   for(const [sKey, vValue] of Object.entries(oValues)) {
      if(vValue !== null && typeof vValue === 'object') {
         oChildField[sKey] = vValue;
         bHasChild = true;
      }
      else { oFieldOrAttribute[sKey] = vValue; }
   }

   // ### Add values as attributes or child field elements based on whether there are complex values

   if(bHasChild) {
      // Case 1: Has complex values - primitives become attributes, complex go as field elements
      for(const [sKey, vValue] of Object.entries(oFieldOrAttribute)) {
         if(vValue !== undefined && vValue !== null) {
            eValues.setAttribute(sKey, String(vValue));
         }
      }

      // Add complex values as field elements with JSON-stringified value
      for(const [sKey, vValue] of Object.entries(oChildField)) {
         const eField = oDocument.createElement(sField);
         eField.setAttribute("name", sKey);
         eField.textContent = JSON.stringify(vValue);
         eValues.appendChild(eField);
      }
   }
   else {
      // Case 2: No complex values - all primitives become field elements
      for(const [sKey, vValue] of Object.entries(oFieldOrAttribute)) {
         const eField = oDocument.createElement(sField);
         eField.setAttribute("name", sKey);
         eField.textContent = String(vValue);
         eValues.appendChild(eField);
      }
   }

   return [ oDocument, eValues ];                                             // returns document and parent values element
}


let iCommandEcho_s = 0; // Module-level counter for echo ids                  @NOTE: This is used in XML.Command to generate unique echo values for matching responses.


const XML = {
   // Create a new XML document with a specified root element name (default "root")
   Create(sRootName = "root") {
      const doc = document.implementation.createDocument("", "", null);
      const eRoot = doc.createElement(sRootName);
      doc.appendChild(eRoot);
      return { document: doc, root: eRoot };
   },

   // Add element (returns element for chaining)
   Add(parent_, name_, attributes_ = {}, text = null) {
      return XML_AppendElement(parent_, attributes_, text, name_).element;
   },

   /** -------------------------------------------------------------------------  XML.Attr
    * Get or set a single attribute on an element.
    * - Read (value_ omitted): returns attribute string or null
    * - Write (value_ provided): sets attribute and returns element for chaining
    *
    * @param {Element} eElement - Target element
    * @param {string} sName - Attribute name
    * @param {*} [value_] - Value to set (omit to read)
    * @returns {string|null|Element} Attribute value when reading, element when writing
    *
    * @example
    * const sType = XML.Attr(eField, "type");             // read → "text"
    * XML.Attr(eField, "type", "number").Attr ...         // write → element (chainable via wrapper)
    */
   Attr(eElement, sName, value_) {
      if(value_ === undefined) { return eElement.getAttribute(sName); }
      eElement.setAttribute(sName, String(value_));
      return eElement;
   },   

   /** -------------------------------------------------------------------------  XML.Find / FindAll
    * CSS-selector based lookup within an XML tree (e.g. "option", "config > server").
    * @param {Element|Document} eRoot
    * @param {string} sSelector
    * @returns {Element|null}
    */
   Find(eRoot, sSelector) { return eRoot.querySelector(sSelector); },

   FindAll(eRoot, sSelector) { return Array.from(eRoot.querySelectorAll(sSelector)); },   

   /** -------------------------------------------------------------------------  XML.FromString
    * Parse an XML string into a Document. Throws if the string is malformed.
    *
    * @param {string} sXml - Well-formed XML string to parse
    * @returns {Document} Parsed XML document
    *
    * @example
    * const oDocument = XML.FromString("<poll><option>Pizza</option></poll>");
    * const eOption = XML.Find(oDocument.documentElement, "option");
    */
   FromString(sXml) {
      const oParser = new DOMParser();
      const oDocument = oParser.parseFromString(sXml, "application/xml");
      const eError = oDocument.querySelector("parsererror");
      if(eError) { throw new Error(`XML parse error: ${eError.textContent.trim()}`); }
      return oDocument;
   },   

   // Serialize an XML document to a string
   ToString(document_) {
      const serializer = new XMLSerializer();
      return serializer.serializeToString(document_);
   },

   // Build a query string from a base URL and an object of parameters
   // Example: XML.ToQueryString("api/data", { id: 123, filter: "active" }) → "api/data?id=123&filter=active"
   ToQueryString( sBase, oParams) {
      const sQuery = new URLSearchParams(oParams).toString();
      return `${sBase}?${sQuery}`;
   },

   Serialize(document_) {
      const serializer = new XMLSerializer();
      return serializer.serializeToString(document_);
   },

   // ==================== NEW FLUENT BUILDER ====================
   /*
    * Example usage:
    * const xml_ = XML.CreateXML("poll")
    *    .Add("option", { name: "Pizza", votes: 10 })
    *    .Parent()
    *    .Add("option", { name: "Burger", votes: 5 })
    *    .Done();
    */
   CreateXML(sRootName = "root") {
      const oDocument = document.implementation.createDocument("", "", null);
      const eRoot = oDocument.createElement(sRootName);
      oDocument.appendChild(eRoot);

      const xml_ = {
         document: oDocument,
         root: eRoot,
         element: eRoot, // current element for building

         SetElement(eElement) { this.element = eElement; return this; },
         GetElement() { return this.element; },

         /** -----------------------------------------------------------------  Add
          * Append a child element to the current element, then move to it.
          * @param {string} sName - Name of the element to add
          * @param {Object} oAttributes - Attributes to set on the new element
          * @param {string|null} sText - Optional text content for the new element
          * @returns {object} The builder object for chaining
          */
         Add(sName, oAttributes = {}, sText = null) {
            const eNew = XML_AppendElement(this.element, oAttributes, sText, sName).element;
            this.element = eNew;
            return this;
         },

         /** -----------------------------------------------------------------  Append
          * Append a sibling element at the same level as the current element, then move to it.
          * @param {string} sName - Name of the element to add
          * @param {Object} oAttributes - Attributes to set on the new element
          * @param {string|null} sText - Optional text content for the new element
          * @returns {object} The builder object for chaining
          */
         Append(sName, oAttributes = {}, sText = null) {
            XML_AppendElement(this.element, oAttributes, sText, sName);
            return this;
         },

         /** -----------------------------------------------------------------  Attr
          * Get or set an attribute on the current element. If value_ is undefined, returns the attribute value; otherwise sets it and returns the builder for chaining.
          * 
          * @param {*} name_ - Attribute name (string) or an object of key-value pairs to set multiple attributes
          * @param {*} value_ - Value to set for the attribute (ignored if name_ is an object)
          * @returns {object|string} The builder object for chaining or the attribute value if getting
          */
         Attr(name_, value_) {
            if( typeof name_ === "string" ) {
               const sName = name_;
               if(value_ === undefined) { return this.element.getAttribute(sName);}
               this.element.setAttribute(sName, String(value_));
            }
            else if( typeof name_ === "object" ) {
               const oAttributes = name_;
               for(const [sKey, value_] of Object.entries(oAttributes)) {
                  this.element.setAttribute(sKey, String(value_));
               }
            }
            return this;
         },

         Text(sText) { this.element.textContent = sText; return this; },

         Parent(iLevels = 1) {
            let e_ = this.element;
            for(let i = 0; i < iLevels; i++) { if (e_.parentElement) e_ = e_.parentElement; }
            this.element = e_;
            return this;
         },

         // Return the built XML document
         Done() { return this.document; },

         // Convenience method to get the XML string directly from the builder
         ToString() { return XML.ToString(this.document); },

         /** ---------------------------------------------------------------------  Command
          * Append a server command to the current element and return a reader
          * function that extracts its result from the server response document.
          *
          * Handles ToQueryString and JSON.stringify of nested values internally,
          * auto-generates the echo id, and binds it to the returned reader so
          * the two sides of the round trip are always in sync.
          *
          * @param {string} sEndpoint        - Server endpoint, e.g. "db/select"
          * @param {Object} oParams          - Query parameters; any object/array value
          *                                    is automatically JSON.stringify'd
          * @param {Object} [oOptions={}]    - Optional overrides
          * @param {string} [oOptions.sEcho] - Echo id; auto-generated if omitted
          * @param {string} [oOptions.sNode] - Result node name to query (default "result")
          * @returns {Function} reader(oData) — extracts content in result and returns it
          *
          * @example — single command
          * const oXml  = XML.CreateXML("root");
          * const read  = oXml.Command("db/select", { query: "user-get", values: { UserK: 5 } });
          * gd.Send("!xml", {}, oXml.Done()).then(oResult => {
          *    const aRows = JSON.parse(read(oResult.data));
          * });
          *
          * @example — multiple commands
          * const oXml      = XML.CreateXML("root");
          * const readArea  = oXml.Command("db/select", { query: "code-get_list", values: { "TCode.CodeGroupK": 10601 } });
          * const readType  = oXml.Command("db/select", { query: "code-get_list", values: { "TCode.CodeGroupK": 10602 } });
          * gd.Send("!xml", {}, oXml.Done()).then(oResult => {
          *    const aArea = JSON.parse(readArea(oResult.data));
          *    const aType = JSON.parse(readType(oResult.data));
          * });
          *
          * @example — explicit echo id (stable for debugging or logging)
          * const read = oXml.Command("db/select", { query: "user-get" }, { sEcho: "user-main" });
          */
         Command(sEndpoint, oParams = {}, oOptions = {}) {
            const sEcho = oOptions.sEcho || String(++iCommandEcho_s);
            const sNode = oOptions.sNode || "result";

            // ## Serialize any nested objects/arrays in oParams; primitives pass through as-is
            const oSerialized = {};
            for(const [sKey, value_] of Object.entries(oParams)) {
               oSerialized[sKey] = (value_ !== null && typeof value_ === "object") ? JSON.stringify(value_) : value_;
            }

            const sQs = XML.ToQueryString(sEndpoint, { echo: sEcho, ...oSerialized });
            XML_AppendElement(this.element, { qs: sQs }, null, "command");

            // ## Return a reader bound to this echo id; caller uses it after Send resolves
            return function(oData) {
               const eNode = oData.querySelector(`${sNode}[echo="${sEcho}"]`);
               if(!eNode) { console.warn(`Command reader: no <${sNode}> with echo="${sEcho}" found`); return null; }
               const sContent = eNode.textContent.trim();
               if(!sContent) { return null; }
               return sContent;
            };
         },         
      };

      return xml_;
   },

   // ==================== Convenience shortcuts ====================
   Commands() {
      return this.CreateXML("commands");
   },
};

/** --------------------------------------------------------------------------- FIELD_CopyValues
 * Copies field values from one element to another.
 *
 * Use this to copy value from elements marked with attribute data-field
 * to another element marked with data-field.
 *
 * This function assumes that both elements have the same structure and field names.
 *
 * @param {Element|string|object} source_ - The source element, a CSS selector string, or a plain object with key-value pairs.
 * @param {Element|string} target_ - The target element or a CSS selector string.
 * @param {Array<string>} [aName] - Optional array of field names to copy; if not provided, all fields are copied.
 * @throws {Error} If the source or target is not an Element or cannot be found.
 * @returns {void}
 */
function FIELD_CopyValues( source_, target_, aName )
{
   let eSource; // Element or string selector for the source element
   let eTarget; // Element or string selector for the target element
   let bSourceIsObject = false; // Flag to track if source is a plain object

   // ## Prepare source element
   if( source_ instanceof Element ) eSource = source_;
   else if( typeof source_ === "string" ) eSource = document.querySelector(source_); // Use querySelector to find the source element by CSS selector
   else if( source_ !== null && typeof source_ === "object" ) { bSourceIsObject = true; } // Source is a plain object (JSON)
   else throw new Error("Invalid source type");

   // ## Prepare target element
   if( target_ instanceof Element ) eTarget = target_;
   else if( typeof target_ === "string" ) eTarget = document.querySelector(target_);
   else throw new Error("Invalid target type")

   if( !eTarget ) { throw new Error("Target element not found"); }

   const bUseFilter = Array.isArray(aName) && aName.length > 0;                // Determine if we should filter by specific field names

   // ## If source is an object, iterate over its keys and set values in target
   if( bSourceIsObject ) {
      Object.keys(source_).forEach(sFieldName => {
         if(bUseFilter && !aName.includes(sFieldName)) { return; } // Skip this field if it's not in the filter list

         const eTargetElement = eTarget.querySelector(`[data-field="${sFieldName}"]`);
         if(eTargetElement) {
            const sValue = source_[sFieldName];
            if(eTargetElement.matches("input, textarea, select")) { eTargetElement.value = sValue ?? ""; }
            else { eTargetElement.textContent = sValue ?? ""; }
         }
      });
      return;
   }

   // If source is an element, iterate over its data-field elements
   if( !eSource ) { throw new Error("Source element not found"); }
   eSource.querySelectorAll('[data-field]').forEach(eSourceElement => {
      const sFieldName = eSourceElement.dataset.field; // Get the field name from data-field attribute
      if(bUseFilter && !aName.includes(sFieldName)) { return; }               // Skip this field if it's not in the filter list

      const eTargetElement = eTarget.querySelector(`[data-field="${sFieldName}"]`);
      if(eTargetElement) {
         if(eTargetElement.matches("input, textarea, select")) { eTargetElement.value = eSourceElement.value ?? ""; }
         else { eTargetElement.textContent = eSourceElement.value ?? eSourceElement.textContent ?? ""; }
      }
   });
}

/** --------------------------------------------------------------------------- THEME_Select
 * Selects a theme file based on sTheme name, this is files with CSS variables.
 * 
 * Use localStorage to save the selected theme so it can be applied on next page load.
 * 
 * Selectable themes are hardcoded.
 * 
 */
function THEME_Select( sTheme, options_ = {}, bReturnKeys = false ) {
   // ## Build the URL with encoded arguments .................................
   const oTypeDefault = {
      color: {
         sStorageKey: "vote.theme.color",
         sDefaultThemeKey: "color-default",
         sApplyMode: "stylesheet",
         sThemePath: "css/variables/",
         sSelector: "link[href*='variables-color-']",
         oValue: {
            "candy-light": "variables-color-candy-light.css",
            "corporate-blue": "variables-color-corporate-blue.css",
            "green-food": "variables-color-green-food.css",
            "green": "variables-color-green.css",
            "grey": "variables-color-grey.css",
            "harvest": "variables-color-harvest.css",
            "midnight-gold": "variables-color-midnight-gold.css",
            "modern-emerald": "variables-color-modern-emerald.css",
            "orange": "variables-color-orange.css",
            "purple-soft": "variables-color-purple-soft.css",
            "red-black": "variables-color-red-black.css",
            "royal-violet": "variables-color-royal-violet.css",
            "soft-candy": "variables-color-soft-candy.css",
            "test": "variables-color-test.css",
            "color-default": "variables-color-default.css",

            "dark-ember": "variables-color-dark-ember.css",
            "dark-forest": "variables-color-dark-forest.css",
            "dark-ocean": "variables-color-dark-ocean.css",
            "dark-violet": "variables-color-dark-violet.css"
         }
      }
   };

   const oDefault = {
      sValue: "",       // If set then take this theme, otherwise use saved/default value
      bPersist: false,  // If true then save selected theme to localStorage
      eTarget: null,    // Optional DOM target override (stylesheet link or element)
      oThemeByType: {}  // Optional external per-type config extensions/overrides
   };

   let oOptions = options_;
   if( typeof options_ === "string") { oOptions = { sValue: options_ }; }     // Allow passing a string as the value for convenience

   const o_ = Object.assign( oDefault, oOptions );

   const sThemeType = String( sTheme || "" ).trim().toLowerCase();            // Get main theme section (maybe "color") that matches key to theme config
   if( Object.keys( oTypeDefault ).includes( sThemeType ) === false  ) { throw new Error( `Unknown theme type: ${sThemeType}.` ); }

   const oThemeByType = Object.assign( {}, oTypeDefault, o_.oThemeByType || {} );

   const oTheme = oThemeByType[sThemeType]; // active theme config, this should now be a valid object in config

   // ## Determine the selected theme value ..................................
   const sThemeValue = String( localStorage.getItem( oTheme.sStorageKey ) || "" ).trim().toLowerCase(); // Get saved theme value from localStorage
   let sSelectedThemeKey = o_.sValue || sThemeValue; // Determine selected theme value: explicit value from options takes precedence over saved value
   if( !sSelectedThemeKey ) { sSelectedThemeKey = oTheme.sDefaultThemeKey; }           // If no explicit or saved value, use default from config

   const oValue = oTheme.oValue || {};
   let sResolved = oValue[sSelectedThemeKey];

   if( !sResolved ) {
      sSelectedThemeKey = oTheme.sDefaultThemeKey;
      sResolved = oValue[sSelectedThemeKey] || sSelectedThemeKey;
   }

   if( oTheme.sApplyMode === "stylesheet" ) {
      // ## Apply theme by updating stylesheet link href, try to find existing link and update it, if not found then throw error
      const eThemeLink = o_.eTarget || document.querySelector( oTheme.sSelector );
      if( !eThemeLink ) { throw new Error( `Theme stylesheet link not found for type: ${sThemeType}` ); }

      const sCurrentHref = String( eThemeLink.getAttribute( "href" ) || "" );
      let sThemeHref = `${oTheme.sThemePath || ""}${sResolved}`;

      if( /variables-[^/\\]+\.css/i.test( sCurrentHref ) ) {
         sThemeHref = sCurrentHref.replace( /variables-[^/\\]+\.css/i, sResolved );
      }

      eThemeLink.setAttribute( "href", sThemeHref );
   }
   else {
      const eTarget = o_.eTarget || document.documentElement;
      eTarget.setAttribute( `data-theme-${sThemeType}`, sResolved );
   }

   if( o_.bPersist ) { localStorage.setItem( oTheme.sStorageKey, sSelectedThemeKey );}

   if( bReturnKeys === true ) { return Object.keys( oValue ); }

   return sSelectedThemeKey;
}

function I18N_GetLanguageKeys() {
   // Return an array of available language keys
   return ["sv", "en", /*"de", "fr"*/];
}

/** --------------------------------------------------------------------------- ELEMENT_Show
 * Show/hide elements based on whether they contain specific keywords in their
 * data-page-state attribute.
 *
 * Elements with data-page-state attribute can have one or more space-separated
 * keywords. If any keyword matches the requested visibility keywords, the
 * element is shown; otherwise it is hidden.
 *
 * This provides a declarative way to control visibility based on page state
 * without scattering visibility logic across CSS or multiple JS files.
 *
 * @param {string|string[]} words_ - Single keyword string or array of keywords
 * @param {Object} [oOptions={}] - Optional configuration
 * @param {string|Element} [oOptions.eContainer="#idPage"] - Container element or selector to search within
 * @param {boolean} [oOptions.bShowByDefault=false] - If true, elements without data-page-state are shown; if false, they are hidden
 * @param {string} [oOptions.sAttribute="data-page-state"] - Attribute name containing visibility keywords
 * @returns {Array<Element>} Array of elements that are visible after applying visibility
 *
 * @example
 * // Show only elements marked with "cast" state
 * ELEMENT_Show("cast");
 *
 * // Show elements marked with either "cast" or "results"
 * ELEMENT_Show(["cast", "results"]);
 *
 * // Search within a specific container
 * ELEMENT_Show("admin", { eContainer: "#idAdminPanel" });
 *
 * // Hide elements without data-page-state by default
 * ELEMENT_Show("closed", { bShowByDefault: false });
 */
function ELEMENT_Show(words_, oOptions = {}) {
   // ## Normalize keywords to array for consistent processing
   const aKeywords = Array.isArray(words_) ? words_ : [String(words_).trim()];
   if(aKeywords.length === 0) { console.warn("ELEMENT_Show: No keywords provided"); return []; }

   // ## Set default options
   const oDefault = { eContainer: "#idPage", bShowByDefault: false, sAttribute: "data-page-state" };
   const o_ = Object.assign({}, oDefault, oOptions);

   // ## Resolve container element ............................................
   let eContainer;
   if(o_.eContainer instanceof Element) { eContainer = o_.eContainer; } 
   else if(typeof o_.eContainer === "string") { 
      eContainer = document.querySelector(o_.eContainer);
      console.assert(eContainer, `ELEMENT_Show: Container not found: "${o_.eContainer}"`);
      if(!eContainer) return [];
   }
   else { console.error("ELEMENT_Show: Invalid container type"); return []; }

   // ## Create Set for O(1) keyword lookup
   const oKeywordSet = new Set(aKeywords.map(s => s.toLowerCase().trim()));

   // ## Find all elements with the target attribute
   const aTarget = eContainer.querySelectorAll(`[${o_.sAttribute}]`);
   const aVisible = [];

   // ## Process each element
   aTarget.forEach(eElement => {
      const sStateValue = eElement.getAttribute(o_.sAttribute);
      if(!sStateValue) return;

      // Split space-separated keywords and check for matches
      const aElementKeywords = sStateValue.toLowerCase().split(/\s+/);
      const bHasMatch = aElementKeywords.some(sKeyword => oKeywordSet.has(sKeyword));

      if(bHasMatch === true) {
         // Show element: restore original display value
         if(eElement.dataset.originalDisplay) {
            eElement.style.display = eElement.dataset.originalDisplay;
            delete eElement.dataset.originalDisplay;
         } else {
            eElement.style.display = "";
         }
         aVisible.push(eElement);
      } 
      else {
         // Hide element but preserve original display value
         if(eElement.style.display !== "none") {
            eElement.dataset.originalDisplay = window.getComputedStyle(eElement).display;
         }
         eElement.style.display = "none";
      }
   });

   // ## Handle elements without the attribute based on bShowByDefault
   if(o_.bShowByDefault === false) {
      const aElementsWithoutState = eContainer.querySelectorAll(`:not([${o_.sAttribute}])`);
      aElementsWithoutState.forEach(eElement => {
         // Skip the container itself and any elements that might be parent wrappers
         if(eElement === eContainer) return;
         if(eElement.closest(`[${o_.sAttribute}]`)) return;                   // Skip children of state-managed elements
         
         // Preserve original display value before hiding
         if(eElement.style.display !== "none") {
            eElement.dataset.originalDisplay = window.getComputedStyle(eElement).display;
         }
         eElement.style.display = "none";
      });
   }
   else {
      // Restore visibility for elements without state attribute
      const aHiddenElements = eContainer.querySelectorAll(`:not([${o_.sAttribute}])[style*="display: none"]`);
      aHiddenElements.forEach(eElement => {
         if(eElement.dataset.originalDisplay) {
            eElement.style.display = eElement.dataset.originalDisplay;
            delete eElement.dataset.originalDisplay;
         } else {
            eElement.style.display = "";
         }
      });
   }
}
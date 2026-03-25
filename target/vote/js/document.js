

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
   AddRecord( oRecord, sId = crypto.randomUUID() ) {
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
   AddTable( oTable, sId = crypto.randomUUID() ) {
      oTable.sId = sId;
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
}

/** --------------------------------------------------------------------------- XML_GetFirstValue
 * Extract first value from second row in XML result. If only one result
 * node found then select that, if more than one then select first with
 * command="select". Throws if no matching node or invalid CDATA structure.
 *
 * @param {string} sXmlString - XML string with result nodes containing CDATA JSON
 * @returns {any|null} First value from second row, or null if fewer than two rows
 */
function XML_GetFirstValue(xml_ , sNode = "result") {
   let oDocument;

   if( typeof xml_ === "object" ) { xml_ = xml_.data; }                    // If input is an object (e.g. server response), extract the XML string from the 'data' property

   // ## check if xml_ isn't xml object, then try to parse it as XML string

   let aResultNodes; // array with result nodes matching sNode name
   if( typeof xml_ === "string" ) {
      // ## Parse XML string and select result node
      const sXmlString = String(xml_); // Ensure it is string
      const oParser = new DOMParser(); // Create a DOMParser
      oDocument = oParser.parseFromString(sXmlString, "application/xml"); // Parse the XML string into a document
      aResultNodes = oDocument.querySelectorAll(sNode);                      // Select all nodes matching the specified name (default "result")
   }
   else if( xml_ instanceof Document ) {                                   // If xml_ is document then no need to parse
      oDocument = xml_; // Use the provided XML Document
      aResultNodes = oDocument.querySelectorAll(sNode); // Select all nodes matching the specified name (default "result")
   }
   else { throw new Error("Invalid XML input"); }
   
   if( !aResultNodes || aResultNodes.length === 0 ) { throw new Error("No result nodes found"); }

   // ## Select the first node
   let oNode = null; // First node value
   if( aResultNodes.length === 1 ) { oNode = aResultNodes[0]; }
   else if( aResultNodes.length > 1 ) { oNode = oDocument.querySelector(sNode + "[command='select']"); }

   if( !oNode ) { throw new Error("No result node with command='select' found"); }

   // ## Extract CDATA content and parse JSON

   const sCData = oNode.textContent; // Extract CDATA content from the selected node, result is placed in cdata
   let data_; // Initialize variable to hold parsed JSON data
   try { data_ = JSON.parse(sCData); }
   catch (oError) { throw new Error("CDATA is not valid JSON: " + oError.message); }

   // ## Handle different formats of node content and try to pick the first value or first object

   if (Array.isArray(data_) === true) {
      const aData = data_; // Only to make code simpler
      if (aData.length < 2 || !aData[1][0]) { return null; }
      else { return aData[1][0]; }                                         // Return the first value in the second row; it's wrapped as an array
   }

   return data_;
};


/** --------------------------------------------------------------------------- XML_GetFirstArray
 * Extract array of values from first result node. Throws if no matching node or invalid CDATA structure.
 *
 * @param {string|Document} xml_ - XML string or Document with result nodes containing CDATA JSON
 * @returns {Array} Array of values from first result node, or empty array if no valid data found
 */
function XML_GetFirstArray(xml_ , sNode = "result") {
   if( typeof xml_ === "object" ) { xml_ = xml_.data; }
   let aResultNodes;
   let oDocument;
   if( typeof xml_ === "string" ) {
      // ## Parse XML string and select result node
      const sXmlString = String(xml_);
      const oParser = new DOMParser();
      oDocument = oParser.parseFromString(sXmlString, "application/xml");
      aResultNodes = oDocument.querySelectorAll(sNode);
   }
   else if( xml_ instanceof Document ) {
      oDocument = xml_;
      aResultNodes = oDocument.querySelectorAll(sNode);
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


/** --------------------------------------------------------------------------- XMP_AppendObject
 * Append an object as a new node with CDATA JSON content to an XML document. If document is null, a new one is created.
 * 
 * If object have any value that is an array or object that is taken and stringified as JSON and primitive values are added as attributes to parent values element.
 * If there isn't any array or object value then all values are added as JSON in CDATA section.
 * 
 * @param {Document|null} oDocument - Existing XML document to append to, or null to create a new one
 * @param {Object} oValues - Object to be stringified as JSON and placed in CDATA section
 * @param {string} sNode - Name of the node to create for the object (default "values")
 * @returns {Document} The XML document with the new node appended
 */
function XML_AppendObject(oDocument, oValues, sNode = "values") {
   // ## Create new XML document if null, otherwise use existing document
   if (oDocument === null) {
      oDocument = document.implementation.createDocument("", "", null);
      const o_ = oDocument.createElement("document");
      oDocument.appendChild(o_);
   }

   // ## Create new node for the object and append to document
   const oNode = oDocument.createElement(sNode);
   
   // ### Separate primitive and complex values
   const oChildField = {};
   const oFieldOrAttribute = {};
   let bHasChild = false;
   
   for (const [sKey, vValue] of Object.entries(oValues)) {
      if (vValue !== null && (typeof vValue === 'object' || Array.isArray(vValue))) {
         oChildField[sKey] = vValue;
         bHasChild = true;
      } 
      else { oFieldOrAttribute[sKey] = vValue;}
   }

   // ### Add values as attributes or child field elements based on whether there are complex values
   
   if(bHasChild) {
      // Case 1: Has complex values - primitives become attributes, complex go to CDATA
      for(const [sKey, vValue] of Object.entries(oFieldOrAttribute)) {
         if(vValue !== undefined && vValue !== null) { oNode.setAttribute(sKey, String(vValue));}
      }
      
      // Add complex values as JSON in CDATA
      if(Object.keys(oChildField).length > 0) {
         const cdata = oDocument.createCDATASection(JSON.stringify(oChildField));
         oNode.appendChild(cdata);
      }
   } else {
      // Case 2: No complex values - all primitive values go as JSON in CDATA
      if(Object.keys(oFieldOrAttribute).length > 0) {
         const cdata = oDocument.createCDATASection(JSON.stringify(oFieldOrAttribute));
         oNode.appendChild(cdata);
      }
   }

   oDocument.documentElement.appendChild(oNode);
   return oDocument;
}

/** --------------------------------------------------------------------------- XMP_AppendObject
 * Append an object as a new node to an XML document. If document is null, a new one is created.
 * 
 * Handles object values in two ways:
 * - If the object contains any complex values (objects or arrays), primitive values become attributes
 *   on the parent node, while complex values are added as child "field" elements with their name and
 *   JSON-stringified value as attributes.
 * - If the object contains only primitive values, all values are added as child "field" elements
 *   with name and value attributes.
 * 
 * @param {Document|null} oDocument - Existing XML document to append to, or null to create a new one
 * @param {Object} oValues - Object containing key-value pairs to be added to the XML
 * @param {string} sNode - Name of the parent node to create for the object (default "values")
 * @param {string} sField - Name of the attribute that holds the value (default "value")
 * @returns {Document} The XML document with the new node appended
 */
function XML_AppendObject(oDocument, oValues, sNode = "values", sField = "value") {
   // ## Create new XML document if null, otherwise use existing document
   if(oDocument === null) {
      oDocument = document.implementation.createDocument("", "", null);
      const o_ = oDocument.createElement("document");
      oDocument.appendChild(o_);
   }

   // ## Create new node for the object
   const oNode = oDocument.createElement(sNode);
   
   // ### Separate primitive and complex values
   const oChildField = {};
   const oFieldOrAttribute = {};
   let bHasChild = false;
   
   for(const [sKey, vValue] of Object.entries(oValues)) {
      if(vValue !== null && (typeof vValue === 'object' || Array.isArray(vValue))) {
         oChildField[sKey] = vValue;
         bHasChild = true;
      } 
      else { oFieldOrAttribute[sKey] = vValue; }
   }

   // ### Add values as attributes or child field elements based on whether there are complex values

   if(bHasChild) {
      // Case 1: Has complex values - primitives become attributes, complex go as field elements
      for (const [sKey, vValue] of Object.entries(oFieldOrAttribute)) {
         if (vValue !== undefined && vValue !== null) {
            oNode.setAttribute(sKey, String(vValue));
         }
      }

      // Add complex values as field elements with JSON-stringified value
      for(const [sKey, vValue] of Object.entries(oChildField)) {
         const oField = oDocument.createElement("field");
         oField.setAttribute("name", sKey);
         oField.setAttribute(sField, JSON.stringify(vValue));
         oNode.appendChild(oField);
      }
      
      oDocument.documentElement.appendChild(oNode);
   }
   else {
      // Case 2: No complex values - all primitives become field elements
      for (const [sKey, vValue] of Object.entries(oFieldOrAttribute)) {
         const oField = oDocument.createElement("field");
         oField.setAttribute("name", sKey);
         oField.setAttribute(sField, String(vValue));
         oNode.appendChild(oField);
      }
      oDocument.documentElement.appendChild(oNode);
   }

   return oDocument;
}


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
 * @param {string} xml_ - XML string with result nodes containing CDATA JSON
 * @returns {any|null} First value from second row, or null if fewer than two rows
 */
function XML_GetFirstValue(xml_ , sNode = "result", sType = "") {
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
      aResultNodes = oDocument.querySelectorAll(sNode); // Select all nodes matching the specified name (default "result")
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

/** ---------------------------------------------------------------------------  XML_AppendElement
 * Append an element with attributes and optional value to a parent XML element.
 *
 * @param {Element} eParent - Parent XML element to append to (must be valid Element)
 * @param {Object} oValues - Object containing key-value pairs to set as XML attributes
 * @param {*} value_ - Optional value to set on a child value element (undefined = no child)
 * @param {string} sNode - Name of the child value element (default "value")
 * @returns {{ parent: Element, element: Element|null }} Parent element and created value element
 */
function XML_AppendElement(eParent, oValues, value_, sNode = "value") {
   if(!(eParent instanceof Element)) { throw new Error("eParent must be a valid Element"); }

   const oDocument = eParent.ownerDocument;
   const eValue = oDocument.createElement(sNode);
   eParent.appendChild(eValue);

   // ## Set object values as attributes on the created element
   for(const [sKey, vValue] of Object.entries(oValues)) {
      if(vValue !== undefined && vValue !== null) {
         eValue.setAttribute(sKey, String(vValue));
      }
   }

   // ## Set value_ as text content if provided
   if(value_ !== undefined) {
      eValue.textContent = String(value_);
   }

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
   else if(document_ instanceof Document) {
      oDocument = document_;
   }
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
            if (eTargetElement.matches("input, textarea, select")) { eTargetElement.value = sValue ?? ""; }
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
         if (eTargetElement.matches("input, textarea, select")) { eTargetElement.value = eSourceElement.value ?? ""; }
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
         sDefaultValue: "color-default",
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
   if( typeof options_ === "string") { oOptions = { sValue: options_ }; }

   const o_ = Object.assign( oDefault, oOptions );

   const sThemeType = String( sTheme || "" ).trim().toLowerCase();            // Get theme type that matches key to theme config
   if( Object.keys( oTypeDefault ).includes( sThemeType ) === false  ) { throw new Error( `Unknown theme type: ${sThemeType}.` ); }

   const oThemeByType = Object.assign( {}, oTypeDefault, o_.oThemeByType || {} );

   const oTheme = oThemeByType[sThemeType]; // active theme config, this should now be a valid object in config

   const sThemeValue = String( localStorage.getItem( oTheme.sStorageKey ) || "" ).trim().toLowerCase(); // Get saved theme value from localStorage

   let sSelectedValue = o_.sValue || sThemeValue; // Determine selected theme value: explicit value from options takes precedence over saved value
   if( !sSelectedValue ) { sSelectedValue = oTheme.sDefaultValue; }           // If no explicit or saved value, use default from config

   const oValue = oTheme.oValue || {};
   let sResolved = oValue[sSelectedValue];

   if( !sResolved ) {
      sSelectedValue = oTheme.sDefaultValue;
      sResolved = oValue[sSelectedValue] || sSelectedValue;
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

   if( o_.bPersist ) { localStorage.setItem( oTheme.sStorageKey, sSelectedValue );}

   if( bReturnKeys === true ) { return Object.keys( oValue ); }

   return sSelectedValue;
}
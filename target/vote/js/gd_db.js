
/** ============================================================================
 * DBRecord - Database Record Management Class
 * ============================================================================
 *
 * A lightweight class for managing database records with schema definition,
 * value storage, and data synchronization capabilities.
 *
 * ## Key Features:
 * - Schema-based column definitions with type support
 * - O(1) value lookups using Map storage
 * - Automatic key column caching for performance
 * - Flexible value setting (single, multiple, bulk operations)
 * - Callback-based data sync (ReadValues/WriteValues) for UI binding
 *
 * ## Basic Usage:
 * ```javascript
 * const oRecord = new DBRecord([
 *    { sName: "FAlias", sType: "string", bKey: true },
 *    { sName: "FFirstName", sType: "string" }
 * ], { sTable: "TUser" });
 *
 * oRecord.SetValue("FAlias", "user123");
 * console.log(oRecord.GetValue("FAlias"));
 * ```
 *
 * ## Public Methods:
 * - constructor()          - Create record with schema
 * - AddValue()              - Add value(s) from object/array
 * - SetValue()              - Set one or many values
 * - GetValue()              - Get value by column name
 * - GetAllValues()          - Get all values as object
 * - GetFilledValues()       - Get all values as object, excluding empty values
 * - ClearValues()           - Clear all values to null
 * - ReadValues()            - Load values via callback
 * - WriteValues()           - Write values via callback
 * - GetKeyValue()           - Get primary key value
 * - SetKeyValue()           - Set primary key value
 * - HasKeyValue()           - Check if key has non-null value
 * - GetColumnNames()        - Get array of column names
 * - AddColumn()             - Add new column(s) to schema
 * - AsJson()                - Convert to JSON object
 */
class DBRecord {
   static column = class {
      /**
       * @param {Object|string} options_ - Either a configuration object or the column name string
       * @param {string} options_.sName - The name of the column, this may be same name as field in database.
       * @param {string} [options_.sAlias] - The alias of the column, this may be different from the name.
       * @param {string} [options_.sType="unknown"] - The type of the column, e.g., "string", "number", "date", "boolean", "array", "object", "enum", "custom".
       * @param {number} [options_.iState=0]
       * @param {number} [options_.iSpecificType=0]
       * @param {number} [options_.bKey=false] - Whether the column is a primary key.
       * @param {number} [options_.bFKey=false] - Whether the column is a foreign key.
       * @param {number} [options_.bRequired=false] - Whether the column is required.
       * @param {string} [options_.sLabel=""] - The label of the column, which is displayed to the user.
       * @param {string} [options_.sDescription=""] - The description of the column, which provides additional information about the column.
       * @param {string|RegExp|null} [options_.pattern=null] - The pattern to validate the column value.
       * @param {string[]} [options_.aMatch=null] - The array of values to match the column value.
       * @param {string} [options_.sError=""]
       * @param {any} [options_.default=null]
       */
      constructor(options_ = {}) {
         if(typeof options_ === "string") { options_ = { sName: options_ }; }
         if(typeof options_ !== "object") { throw new Error("Invalid argument"); }

         const oOptions = Object.assign({ sName: "", sAlias: "", sType: "string", iState: 0, iSpecificType: 0, bRequired: false }, options_);

         this.sName = oOptions.sName || "";
         this.sAlias = oOptions.sAlias || this.sName;
         this.sType = oOptions.sType || "unknown";
         this.iState = oOptions.iState || 0; // e.g., 0: none, 1: sorted asc, 2: sorted desc, 4: aligned middle, 8: aligned right
         this.iSpecificType = oOptions.iSpecificType || 0;
         this.bKey = oOptions.bKey || false;
         this.bFKey = oOptions.bFKey || false;
         this.bRequired = oOptions.bRequired || false;
         this.sLabel = oOptions.sLabel || "";
         this.sDescription = oOptions.sDescription || "";
         this.pattern_ = oOptions.pattern || null;
         this.aMatch = oOptions.aMatch || null;
         this.sError = oOptions.sError || "";
         this.default_ = oOptions.default || null;
      }

      is_string() { return this.sType === "string"; }
      is_number() { return this.sType === "number"; }
      is_aligned_middle() { return (this.iState & 4) === 4; }
      is_aligned_right() { return (this.iState & 8) === 8; }
      is_key() { return this.bKey; }
      is_foreign_key() { return this.bFKey; }
      is_required() { return this.bRequired; }

      get name() { return this.sName; }
      get alias() { return this.sAlias; }
      get type() { return this.sType; }
      get default() { return this.default_; }
   }

   /** -----------------------------------------------------------------------
    * Create a new DBRecord instance
    * @param {Array|Object|string} columns_ - Column definitions
    * @param {Object|string} [options_={}] - Configuration options or table name
    * @param {string} [options_.sTable] - Table name
    * @param {Array} [options_.aColumn] - Pre-built column array (overrides columns_)
    * @param {Array} [options_.aValues] - Initial values
    * @param {Function} [options_.fnRead] - Callback for ReadValues: (sName, oColumn) => void
    * @param {Function} [options_.fnWrite] - Callback for WriteValues: (sName, oColumn) => void
    */
   constructor(columns_ = [], options_ = {}) {
      if( columns_ === undefined || columns_ === null ) columns_ = [];
      if(typeof columns_ === "string") { columns_ = columns_.split(","); }
      else if(columns_.constructor === Object) { columns_ = [columns_]; }
      if(!Array.isArray(columns_)) { throw new Error("Invalid argument: columns must be array, object, or string"); }

      if(typeof options_ === "string") { options_ = { sTable: options_ }; }
      if(typeof options_ !== "object") { throw new Error("Invalid argument: options must be string or object"); }

      // ## Build column array from columns_ parameter or use provided aColumn
      this.aColumn = options_.aColumn || columns_.map(column => new DBRecord.column(column));

      // ## Validate unique column names .....................................
      const aNames = this.aColumn.map(col => col.sName);
      const aUnique = [...new Set(aNames)];
      if(aNames.length !== aUnique.length) { throw new Error("Duplicate column names detected"); }

      this.sTable = options_.sTable || "";
      this.fnRead = options_.fnRead || null;
      this.fnWrite = options_.fnWrite || null;

      this.mapValues = new Map(); // Use Map for O(1) lookups by column name
      if(options_.aValues) { options_.aValues.forEach(value_ => this.AddValue(value_)); }

      this._aKeyColumns = null;  // Cache for key columns, initialized on demand
   }

   /** ------------------------------------------------------------------------
    * Get the table name
    * @returns {string} The table name
    */
   get table() { return this.sTable; }

   /** ------------------------------------------------------------------------
    * Set the table name
    * @param {string} value_ - The table name to set
    */
   set table(value_) { this.sTable = value_; }

   /** ------------------------------------------------------------------------
    * Add value(s) to the record from {name, value} format
    * @param {Object|Array|*} value_ - Value to add (object with {name, value}, array of such objects, or single value)
    */
   AddValue(value_) {
      if(value_.constructor === Object && value_.name !== undefined) {
         // ## Single {name, value} object ...................................
         this._set_value_internal(value_.name, value_.value);
      }
      else if(Array.isArray(value_)) {
         // ## Array of {name, value} objects ................................
         value_.forEach(item => {
            if(item.constructor === Object && item.name !== undefined) {
               this._set_value_internal(item.name, item.value);
            }
         });
      }
      else if(value_.constructor === Object) {
         // ## Plain object with key-value pairs
         Object.keys(value_).forEach(key => this._set_value_internal(key, value_[key]));
      }
   }

   /** ------------------------------------------------------------------------
    * Set one or many values (supports multiple formats)
    * @param {string|Object|Array} name_ - Column name, object with {sName, value}, object with column names as keys, array of column names, or nested array [[columnNames], [values]]
    * @param {*} [value_] - Value to set (if name_ is string) or array of values (if name_ is array of column names)
    *
    * @example
    * // String with value
    * SetValue("FAlias", "mzrsa7idtopjs3fvqfd9");
    *
    * @example
    * // Object with multiple values
    * SetValue({FAlias: "mzrsa7idtopjs3fvqfd9", FFirstName: null});
    *
    * @example
    * // Two arrays format: column names and corresponding values
    * let aNames = ["FAlias","FFirstName","FLastName","FMail","FPassword","FDisplayName","FLoginName"];
    * let aValues = ["mzrsa7idtopjs3fvqfd9",null,null,"wvv0223rfenjvhklzuw8","6rgaru1uxwlezvmz9o9h4c","wpvfkebwapr6vhsmykqap","q3giuvyyawqzaqtvw42ele"];
    * SetValue(aNames, aValues);
    *
    * @example
    * // Nested array format: [[columnNames], [values]]
    * SetValue([["FAlias","FFirstName","FLastName","FMail","FPassword","FDisplayName","FLoginName"],
    *           ["mzrsa7idtopjs3fvqfd9",null,null,"wvv0223rfenjvhklzuw8","6rgaru1uxwlezvmz9o9h4c","wpvfkebwapr6vhsmykqap","q3giuvyyawqzaqtvw42ele"]]);
    */
   SetValue(name_, value_) {
      // ## Handle nested array format [[columnNames], [values]] ..............
      if(Array.isArray(name_) && name_.length === 2 && Array.isArray(name_[0]) && Array.isArray(name_[1])) {
         const aColumnNames = name_[0];
         const aValues = name_[1];
         aColumnNames.forEach((sColumnName, iIndex) => {
            const oColumn = this._get_column(sColumnName);
            if(oColumn) { this._set_value_internal(sColumnName, aValues[iIndex]); } // Only set if column exists, skip if not found
         });
      }
      // ## Handle two arrays format: SetValue([names], [values]) ............
      else if(Array.isArray(name_) && Array.isArray(value_)) {
         name_.forEach((sColumnName, iIndex) => {
            const oColumn = this._get_column(sColumnName);
            if(oColumn) { this._set_value_internal(sColumnName, value_[iIndex]); } // Only set if column exists, skip if not found
         });
      }
      // ## Set muliple values {columnName1: value1, columnName2: value2, ...}
      else if(name_.constructor === Object && value_ === undefined) {
         Object.keys(name_).forEach(sColumnName => {
            const oColumn = this._get_column(sColumnName);
            if(oColumn) { this._set_value_internal(sColumnName, name_[sColumnName]); } // Only set if column exists, skip if not found
         });
      }
      // ## Handle string column name with value .............................
      else if(typeof name_ === "string") {
         const oColumn = this._get_column(name_);
         if(!oColumn) { throw new Error(`Column '${name_}' not found`); }
         this._set_value_internal(name_, value_);
      }
      else { throw new Error("Invalid arguments: expected string, object, or array"); }
   }

   /** ------------------------------------------------------------------------
    * Get a value by column name
    * @param {string} sName - Column name
    * @returns {*} The value or undefined if not found
    */
   GetValue(sName) {
      const oColumn = this._get_column(sName);
      const value_ = this.mapValues.get(sName);

      // Return default value if not set and column has a default
      if ((value_ === undefined || value_ === null) && oColumn && oColumn.default !== undefined && oColumn.default !== null) {
         return oColumn.default;
      }

      return value_;
   }

   /** ------------------------------------------------------------------------
    * Get all values as an object
    * @returns {Object} Object with column names as keys
    */
   GetAllValues() {
      const oResult = {};
      this.mapValues.forEach((value, key) => { oResult[key] = value; });
      return oResult;
   }

   /** ------------------------------------------------------------------------
    * Get filled values as an object (skips empty values unless required)
    * @returns {Object} Object with column names as keys
    */
   GetFilledValues() {
      const oResult = {};

      // ## Helper function to check if a value is empty ......................
      const empty_ = (value) => {
         if (value === null || value === undefined) return true;
         if (typeof value === "string" && value === "") return true;
         if (Array.isArray(value) && value.length === 0) return true;
         if (typeof value === "object" && Object.keys(value).length === 0) return true;
         return false;
      };

      // ## Iterate through columns to check required flag ....................
      this.aColumn.forEach((column) => {
         const sName = column.name;
         if(column.is_key()) return;                                           // skip key


         let vValue = this.mapValues.get(sName);

         if( empty_(vValue) && !empty_(column.default) ) { vValue = column.default; } // Set default value if empty and has default

         if(empty_(vValue) && !column.is_required()) { return; }               // Skip if empty and not required

         oResult[sName] = vValue;
      });

      return oResult;
   }

   /** ------------------------------------------------------------------------
    * Clear all values from the record (sets to null and calls WriteValues)
    */
   ClearValues() {
      // Set all values to null
      this.mapValues.forEach((value, key) => { this.mapValues.set(key, null); });
      this.WriteValues();
      this._aKeyColumns = null;
   }


   /** ------------------------------------------------------------------------
    * Load values from external source via callback (e.g., from HTML inputs)
    *
    * Callback receives (sName, oColumn) and should call this.SetValue(sName, value)
    *
    * @param {Function} [fnRead] - Optional callback to override constructor callback
    * @throws {Error} If no callback has been registered
    */
   ReadValues(fnRead) {
      fnRead = fnRead || this.fnRead;
      if( !fnRead ) { throw new Error("No load callback registered."); }

      this.aColumn.forEach( oColumn => { fnRead.call( this, oColumn.sName, oColumn ); });
   }

   /** ------------------------------------------------------------------------
    * Write values to external target via callback (e.g., to HTML inputs)
    *
    * Callback receives (sName, oColumn, value) and should update the target
    *
    * @param {Function} [fnWrite] - Optional callback to override constructor callback
    * @throws {Error} If no callback has been registered
    */
   WriteValues(fnWrite) {
      fnWrite = fnWrite || this.fnWrite;
      if( !fnWrite ) { throw new Error("No write callback registered."); }

      this.aColumn.forEach( oColumn => { fnWrite.call( this, oColumn.sName, oColumn ); });
   }

   /** ------------------------------------------------------------------------
    * Get the primary key value (requires exactly one key column)
    *
    * Key values are values used as primary keys in the database.
    *
    * @returns {*} The key value or undefined
    */
   GetKeyValue() {
      const aKeyColumns = this._get_key_columns();

      if(aKeyColumns.length === 0) { throw new Error("No key columns defined"); }
      if(aKeyColumns.length > 1) { throw new Error("Multiple key columns found, use GetValue instead"); }

      return this.mapValues.get(aKeyColumns[0].sName);
   }

   /** ------------------------------------------------------------------------
    * Set the primary key value (requires exactly one key column)
    * @param {*} key_ - The key value to set
    */
   SetKeyValue(key_) {
      const aKeyColumns = this._get_key_columns();

      if(aKeyColumns.length === 0) { throw new Error("No key columns defined"); }
      if(aKeyColumns.length > 1) { throw new Error("Multiple key columns found, use SetValue instead"); }

      this._set_value_internal(aKeyColumns[0].sName, key_);
   }

   /** ------------------------------------------------------------------------
    * Check if the record has a non-null value for any key column
    * @returns {boolean} True if at least one key column has a non-null value
    */
   HasKeyValue() {
      const aKeyColumns = this._get_key_columns();

      if(aKeyColumns.length === 0) { throw new Error("No key columns defined"); }

      return aKeyColumns.some(column => {
         const value = this.mapValues.get(column.sName);
         return value != null;                                                 // Checks for both null AND undefined
      });
   }

   /** ------------------------------------------------------------------------
    * Get all column names
    * @returns {Array<string>} Array of column names
    */
   GetColumnNames() { return this.aColumn.map(column => column.sName); }

   /** ------------------------------------------------------------------------
    * Add new column(s) to the record schema with optional property mapping
    * @param {Object|Array} column_ - Column definition or array of column definitions
    * @param {Object|string} [map_] - Mapping object or string to map source properties to column properties
    *   - If object: { targetProp: sourceProp, ... } e.g., { sLabel: "label", sName: "field" }
    *   - If string: "targetProp,sourceProp;..." e.g., "sLabel,label;sName,field"
    */
   AddColumn(column_, map_) {
      if(Array.isArray(column_)) {
         // ## Process array of column definitions ............................
         if(map_) {
            // ## Parse mapping if string ...................................
            let oMap = map_;
            if(typeof map_ === "string") {
               oMap = {};
               map_.split(";").forEach(pair => {
                  const [target, source] = pair.split(",").map(s => s.trim());
                  if(target && source) { oMap[target] = source; }
               });
            }

            // ## Apply mapping to each item and add column .................
            column_.forEach(item_ => {
               const oColumn = {}; // new column to add
               Object.keys(oMap).forEach(sTargetKey => {
                  const sSourceKey = oMap[sTargetKey]; // get the key used to describe filed in input data
                  if(item_[sSourceKey] !== undefined) { oColumn[sTargetKey] = item_[sSourceKey]; } // copy to column if value exists
               });
               this.aColumn.push(new DBRecord.column(oColumn));
            });
         }
         else {
            column_.forEach(item => { this.aColumn.push(new DBRecord.column(item)); }); // No mapping, add columns directly
         }

         this._aKeyColumns = null;                                            // Invalidate key column cache
      }
      else {
         this.aColumn.push(new DBRecord.column(column_));                     // Single column definition
         this._aKeyColumns = null;                                            // Invalidate key column cache
      }
   }

    /** ------------------------------------------------------------------------
    * Convert record to JSON-serializable object (includes schema and values)
    * @returns {Object} Object with table, columns, and values
    */
    AsJson() {
       return {
          sTable: this.sTable,
          aColumn: this.aColumn.map(c_ => ({
             sName: c_.sName,
             sAlias: c_.sAlias,
             sType: c_.sType,
             iState: c_.iState,
             iSpecificType: c_.iSpecificType,
             bKey: c_.bKey,
             bFKey: c_.bFKey,
             sLabel: c_.sLabel,
             sDescription: c_.sDescription,
             sError: c_.sError,
             aMatch: c_.aMatch,
             default: c_.default
          })),
          oValues: this.GetAllValues()
       };
    }

    /** ------------------------------------------------------------------------
     * Get a column by name, index, or properties
     * @param {string|number|Object} column_ - Column identifier
     * @returns {Object|undefined} The column or undefined
     * @private
     */
    _get_column(column_) {
       let oColumn;
       if(typeof column_ === "string") {
          oColumn = this.aColumn.find(column => column.sName === column_);
       }
       else if(typeof column_ === "number") {
          oColumn = this.aColumn[column_];
       }
       else if(typeof column_ === "object") {
          if(column_.sName) {
             oColumn = this.aColumn.find(column => column.sName === column_.sName);
          }
          else if(column_.bKey) {
             oColumn = this.aColumn.find(column => column.bKey === true);
          }
          else if(column_.bFKey) {
             oColumn = this.aColumn.find(column => column.bFKey === true);
          }
       }

       return oColumn;
    }

   /** ------------------------------------------------------------------------
    * Get all columns matching criteria
    * @param {string|number|Object} column_ - Filter criteria
    * @returns {Array} Array of matching columns
    * @private
    */
   _get_column_all(column_) {
      let aColumn = [];
      if(typeof column_ === "string") {
         aColumn = this.aColumn.filter(column => column.sName === column_);
      }
      else if(typeof column_ === "number") {
         // ## Get column by index
         const oCol = this.aColumn[column_];
         if(oCol) { aColumn = [oCol]; }
      }
      else if(typeof column_ === "object") {
         if(column_.bKey !== undefined) {
            aColumn = this.aColumn.filter(column => column.bKey === column_.bKey);
         }
         else if(column_.bFKey !== undefined) {
            aColumn = this.aColumn.filter(column => column.bFKey === column_.bFKey);
         }
         else if(column_.sName) {
            aColumn = this.aColumn.filter(column => column.sName === column_.sName);
         }
         else if(column_.sType) {
            aColumn = this.aColumn.filter(column => column.sType === column_.sType);
         }
      }

      return aColumn;
   }

   /** ------------------------------------------------------------------------
    * Internal method to set a value (with validation)
    * @param {string} sName - Column name
    * @param {*} value_ - Value to set
    * @private
    */
   _set_value_internal(sName, value_) {
      const oColumn = this._get_column(sName);
      if(!oColumn) { console.warn(`Warning: Setting value for undefined column '${sName}'`); }
      this.mapValues.set(sName, value_);
   }

   /** ------------------------------------------------------------------------
    * Get cached key columns
    * @returns {Array} Array of key columns
    * @private
    */
   _get_key_columns() {
      if(this._aKeyColumns === null) {
         this._aKeyColumns = this.aColumn.filter(col => col.bKey === true);
      }
      return this._aKeyColumns;
   }
}

// ============================================================================
// DBRecord.extend - Prototype extension utility
// ============================================================================
DBRecord.extend = function(sName, fn) {
   if(typeof sName !== "string" || !sName) { throw new Error("extend() requires a method name string"); }
   if(typeof fn !== "function")            { throw new Error("extend() requires a function"); }
   if(DBRecord.prototype[sName])           { console.warn(`DBRecord.extend: overwriting existing method '${sName}'`); }

   DBRecord.prototype[sName] = fn;
};


/** ============================================================================
 * DBRecordContainer
 * ============================================================================
 *
 * Extends DBRecord with container-based element discovery and DOM sync.
 * Use this in place of DBRecord whenever a form or container is involved.
 * DBRecord itself remains pure — no DOM references live there.
 *
 * ## Key Concepts:
 * - One container element is bound at a time (form, div, fieldset, etc.)
 * - Elements are discovered via a configurable strategy chain
 * - Manual bindings (Bind()) survive re-scans and take priority
 * - ReadValues / WriteValues work the same as DBRecord but target DOM elements
 *
 * ## Usage:
 * ```javascript
 * const oRecord = new DBRecordContainer(
 *    [{ sName: "FFirstName", sType: "string" }],
 *    { sTable: "TUser", oContainer: document.getElementById("user_form") }
 * );
 *
 * oRecord.WriteValues();   // record → DOM
 * oRecord.ReadValues();    // DOM → record
 * ```
 *
 * ## Public methods added over DBRecord:
 * - BindContainer(element, options)  - Bind container and run initial scan
 * - UnbindContainer()                - Remove container and auto-discovered bindings
 * - ScanContainer()                  - Re-run element discovery
 * - GetContainer()                   - Get the bound container element
 * - Bind(sName, element, options)    - Manually bind a specific element
 * - Unbind(sName)                    - Remove a specific element binding
 * - HasElement(sName)                - Check if element is bound for column
 * - GetElement(sName)                - Get bound element for column
 */
class DBRecordContainer extends DBRecord {

   /** -----------------------------------------------------------------------
    * @param {Array|Object|string} columns_         - Column definitions (same as DBRecord)
    * @param {Object}              [options_={}]    - All DBRecord options, plus:
    * @param {Element}             [options_.oContainer]   - Container element to bind immediately
    * @param {Function[]}          [options_.aStrategies]  - Query strategy chain (replaces defaults)
    * @param {Function}            [options_.fnQuery]      - Single strategy appended after defaults
    */
   constructor(columns_ = [], options_ = {}) {
      super(columns_, options_);

      this.mapElements  = new Map();  // sName → { element, fnGet, fnSet, _manual }
      this.container_  = null;       // { element, aStrategies }

      // ## Bind container immediately if provided in options .................
      if(options_.container instanceof Element) {
         this.BindContainer(options_.container, options_);
      }
   }

   // ==========================================================================
   // Strategy chain
   // ==========================================================================

   /** Default query strategies — tried in order, first match wins */
   static aStrategiesDefault = [
      (e_, column) => e_.querySelector(`[data-field="${column.sName}"]`),
      (e_, column) => e_.querySelector(`[data-columnumn="${column.sName}"]`),
      (e_, column) => e_.querySelector(`[name="${column.sName}"]`),
      (e_, column) => e_.querySelector(`#${column.sName}`),
      (e_, column) => e_.querySelector(`[id$="_${column.sName}"]`),
   ];

   // ==========================================================================
   // Container binding
   // ==========================================================================

   /** -----------------------------------------------------------------------
    * Bind a container element and auto-discover child elements per column.
    * Runs an initial scan immediately. Manual bindings are never overwritten.
    *
    * @param {Element}    container_           - Container to scan within
    * @param {Object}     [options_={}]
    * @param {Function[]} [options_.aStrategies]  - Replaces default strategy chain
    * @param {Function}   [options_.fnQuery]      - Appended after default strategies
    * @param {boolean}    [options_.bRescan=false] - If true, re-scan already discovered columns
    *
    * @returns {this} For chaining
    */
   BindContainer(container_, options_ = {}) {
      if(!(container_ instanceof Element)) { throw new Error("BindContainer: Invalid container element"); }

      let aStrategies = options_.aStrategies || DBRecordContainer.aStrategiesDefault;
      if(typeof options_.fnQuery === "function") {
         aStrategies = [...aStrategies, options_.fnQuery];
      }

      this.container_ = { element: container_, aStrategies, bRescan: options_.bRescan || false };

      this.ScanContainer();
      return this;
   }

   /** -----------------------------------------------------------------------
    * Remove the container binding and all auto-discovered element bindings.
    * Manual bindings set via Bind() are preserved.
    * @returns {this}
    */
   UnbindContainer() {
      if(this.mapElements) {
         this.mapElements.forEach((binding, sName) => {
            if(binding._auto) { this.mapElements.delete(sName); }
         });
      }
      this.container_ = null;
      return this;
   }

   /** -----------------------------------------------------------------------
    * Re-run element discovery against the bound container.
    * Useful when the DOM changes after the initial BindContainer() call.
    *
    * @returns {this}
    * @throws {Error} If no container has been bound
    */
   ScanContainer() {
      if(!this.container_) { throw new Error("ScanContainer: No container bound. Call BindContainer() first."); }

      const { element: oContainer, aStrategies, bRescan } = this.container_;

      let fnLockedStrategy = this.container_.fnLockedStrategy || null;  // Persist lock across re-scans

      this.aColumn.forEach(oColumn => {
         const sName    = oColumn.sName;
         const existing = this.mapElements.get(sName);

         if(existing?._manual)           { return; }   // Never overwrite manual bindings
         if(existing?._auto && !bRescan) { return; }   // Skip already discovered unless rescanning

         // ## Try locked strategy first if one has been established ............
         if(fnLockedStrategy) {
            try {
               const oFound = fnLockedStrategy(oContainer, oColumn);
               if(oFound instanceof Element) {
                  this.mapElements.set(sName, { element: oFound, fnGet: null, fnSet: null, _auto: true });
                  return;                              // Done — locked strategy worked
               }
            }
            catch(e) { console.warn(`ScanContainer: Locked strategy threw for column '${sName}':`, e); }
         }

         // ## No lock yet, or locked strategy missed — run full chain ..........
         for(const fnStrategy of aStrategies) {
            try {
               const oFound = fnStrategy(oContainer, oColumn);
               if(oFound instanceof Element) {
                  this.mapElements.set(sName, { element: oFound, fnGet: null, fnSet: null, _auto: true });

                  // ## Lock onto first winning strategy if not already locked ..
                  if(!fnLockedStrategy) {
                     fnLockedStrategy = fnStrategy;
                     this.container_.fnLockedStrategy = fnStrategy;  // Persist for re-scans
                     console.debug(`ScanContainer: Strategy locked on index ${aStrategies.indexOf(fnStrategy)} for column '${sName}'`);
                  }

                  break;
               }
            }
            catch(e) { console.warn(`ScanContainer: Strategy threw for column '${sName}':`, e); }
         }
      });

      return this;
   }

   /** Returns the currently locked strategy function, or null if not yet established */
   GetLockedStrategy() { return this.container_?.fnLockedStrategy ?? null; }

   /** Clear the locked strategy so the next ScanContainer() re-detects it */
   ResetLockedStrategy() {
      if(this.container_) { this.container_.fnLockedStrategy = null; }
      return this;
   }

   /** -----------------------------------------------------------------------
    * @returns {Element|null} The bound container element
    */
   GetContainer() { return this.container_?.element ?? null; }

   // ==========================================================================
   // Manual element binding
   // ==========================================================================

   /** -----------------------------------------------------------------------
    * Manually bind a specific element to a column.
    * Manual bindings take priority over container discovery and survive ScanContainer().
    *
    * @param {string}   sName          - Column name
    * @param {Element}  element_       - Element to bind
    * @param {Object}   [options_={}]
    * @param {Function} [options_.fnGet] - Custom getter: (element) => value
    * @param {Function} [options_.fnSet] - Custom setter: (element, value) => void
    *
    * @returns {this} For chaining
    */
   Bind(sName, element_, options_ = {}) {
      if(!this._get_column(sName))           { throw new Error(`Bind: Column '${sName}' not found`); }
      if(!(element_ instanceof Element))     { throw new Error(`Bind: Invalid element for '${sName}'`); }

      this.mapElements.set(sName, {
         element: element_,
         fnGet:   options_.fnGet || null,
         fnSet:   options_.fnSet || null,
         _manual: true
      });
      return this;
   }

   /** -----------------------------------------------------------------------
    * Remove a specific element binding (manual or auto-discovered).
    * @param {string} sName - Column name
    * @returns {this}
    */
   Unbind(sName) {
      this.mapElements.delete(sName);
      return this;
   }

   /** @returns {boolean} Whether a column has a bound element */
   HasElement(sName) { return this.mapElements.has(sName); }

   /** @returns {Element|null} The bound element for a column */
   GetElement(sName) { return this.mapElements.get(sName)?.element ?? null; }

   // ==========================================================================
   // Override ReadValues / WriteValues to target DOM elements
   // ==========================================================================

   /** -----------------------------------------------------------------------
    * Pull values from bound elements into the record.
    * Columns without a bound element fall back to fnRead callback (DBRecord behavior).
    *
    * @param {Function} [fnRead] - Fallback callback for unbound columns
    * @returns {this}
    */
   ReadValues(fnRead) {
      fnRead = fnRead || this.fnRead;

      this.aColumn.forEach(oColumn => {
         const sName   = oColumn.sName;
         const binding = this.mapElements.get(sName);

         if(binding) { this._set_value_internal(sName, this._read_element(binding)); }
         else if(fnRead) { fnRead.call(this, sName, oColumn); }
      });

      return this;
   }

   /** -----------------------------------------------------------------------
    * Push record values out to bound elements.
    * Columns without a bound element fall back to fnWrite callback (DBRecord behavior).
    *
    * @param {Function} [fnWrite] - Fallback callback for unbound columns
    * @returns {this}
    */
   WriteValues(fnWrite) {
      fnWrite = fnWrite || this.fnWrite;

      this.aColumn.forEach(oColumn => {
         const sName   = oColumn.sName;
         const binding = this.mapElements.get(sName);
         const value   = this.mapValues.get(sName) ?? null;

         if(binding) { this._write_element(binding, value); }
         else if(fnWrite) { fnWrite.call(this, sName, oColumn); }
      });

      return this;
   }

   // ==========================================================================
   // Private element I/O
   // ==========================================================================

   _read_element(binding) {
      if(binding.fnGet) { return binding.fnGet(binding.element); }

      const el    = binding.element;
      const sTag  = el.tagName.toLowerCase();
      const sType = (el.type || "").toLowerCase();

      if(sTag === "input" && (sType === "checkbox" || sType === "radio")) { return el.checked; }
      if(sTag === "input" || sTag === "textarea" || sTag === "select")    { return el.value; }
      return el.textContent;
   }

   _write_element(binding, value) {
      if(binding.fnSet) { binding.fnSet(binding.element, value); return; }

      const el    = binding.element;
      const v     = value ?? "";
      const sTag  = el.tagName.toLowerCase();
      const sType = (el.type || "").toLowerCase();

      if(sTag === "input" && (sType === "checkbox" || sType === "radio")) { el.checked = !!value; return; }
      if(sTag === "input" || sTag === "textarea" || sTag === "select")    { el.value = v; return; }
      el.textContent = v;
   }
}

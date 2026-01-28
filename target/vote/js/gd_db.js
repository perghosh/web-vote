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

         const oOptions = Object.assign({ sName: "", sAlias: "", sType: "string", iState: 0, iSpecificType: 0 }, options_);

         this.sName = oOptions.sName || "";
         this.sAlias = oOptions.sAlias || this.sName;
         this.sType = oOptions.sType || "unknown";
         this.iState = oOptions.iState || 0; // e.g., 0: none, 1: sorted asc, 2: sorted desc, 4: aligned middle, 8: aligned right
         this.iSpecificType = oOptions.iSpecificType || 0;
         this.bKey = oOptions.bKey || false;
         this.bFKey = oOptions.bFKey || false;
         this.sLabel = oOptions.sLabel || "";
         this.sDescription = oOptions.sDescription || "";
         this.pattern_ = oOptions.pattern || null;
         this.aMatch = oOptions.aMatch || null;
         this.sError = oOptions.sError || "";
         this.default = oOptions.default || null;
      }

      is_string() { return this.sType === "string"; }
      is_number() { return this.sType === "number"; }
      is_aligned_middle() { return (this.iState & 4) === 4; }
      is_aligned_right() { return (this.iState & 8) === 8; }
      is_key() { return this.bKey; }
      is_foreign_key() { return this.bFKey; }

      get name() { return this.sName; }
      get alias() { return this.sAlias; }
      get type() { return this.sType; }
   }

   /** -----------------------------------------------------------------------
    * @param {Array|Object|string} columns_ - Column definitions
    * @param {Object|string} [options_={}] - Configuration options or table name
    * @param {string} [options_.sTable] - Table name
    * @param {Array} [options_.aColumn] - Pre-built column array (overrides columns_)
    * @param {Array} [options_.aValues] - Initial values
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


      // ## Use Map for O(1) value lookups instead of array ..................
      this.mapValues = new Map();

      // ## Cache key columns for performance ................................
      this._aKeyColumns = null;


      // ## Initialize with provided values if any ...........................
      if(options_.aValues) { options_.aValues.forEach(value_ => this.AddValue(value_)); }
   }

   get table() { return this.sTable; }
   set table(value_) { this.sTable = value_; }

   /** ------------------------------------------------------------------------
    * Add value(s) to the record
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
    * Set a single value by column name
    * @param {string|Object} name_ - Column name or object with {sName, value}
    * @param {*} [value_] - Value to set (if name_ is string)
    */
   SetValue(name_, value_) {
      let sName = name_.constructor === Object ? name_.sName : name_;
      let vValue = name_.constructor === Object ? name_.value : value_;

      const oColumn = this._get_column(sName);
      if(!oColumn) { throw new Error(`Column '${sName}' not found`); }

      this._set_value_internal(sName, vValue);
   }

   /** ------------------------------------------------------------------------
    * Set value(s) for one or more columns
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
   GetValue(sName) { return this.mapValues.get(sName); }

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
    * Clear all values from the record
    */
   ClearValues() {
      // Set all values to null
      this.mapValues.forEach((value, key) => { this.mapValues.set(key, null); });
      this.WriteValues();
      this._aKeyColumns = null;
   }


   /** ------------------------------------------------------------------------
    * Load values by calling the registered callback for each column
    *
    * This method iterates over all columns and calls the registered callback
    * for each one. The callback is responsible for retrieving the value and
    * setting it via oRecord.SetValue()
    *
    * @throws {Error} If no callback has been registered
    */
   ReadValues(fnRead) {
      fnRead = fnRead || this.fnRead;
      if( !fnRead ) { throw new Error("No load callback registered."); }

      this.aColumn.forEach( oColumn => { fnRead.call( this, oColumn.sName, oColumn ); });
   }

   /** ------------------------------------------------------------------------
    * Write values by calling the registered callback for each column
    *
    * This method iterates over all columns and calls the registered callback
    * for each one. The callback is responsible for writing the value to the
    * database.
    *
    * @throws {Error} If no callback has been registered
    */
   WriteValues(fnWrite) {
      fnWrite = fnWrite || this.fnWrite;
      if( !fnWrite ) { throw new Error("No write callback registered."); }

      this.aColumn.forEach( oColumn => { fnWrite.call( this, oColumn.sName, oColumn ); });
   }

   /** ------------------------------------------------------------------------
    * Get the key value (works when there's exactly one key column)
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
    * Set the value of a key column (works when there's exactly one key column)
    * @param {*} key_ - The key value to set
    */
   SetKeyValue(key_) {
      const aKeyColumns = this._get_key_columns();

      if(aKeyColumns.length === 0) { throw new Error("No key columns defined"); }
      if(aKeyColumns.length > 1) { throw new Error("Multiple key columns found, use SetValue instead"); }

      this._set_value_internal(aKeyColumns[0].sName, key_);
   }

   /** ------------------------------------------------------------------------
    * Check if the record has a value for any key column
    * @returns {boolean} True if at least one key column has a value
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
    * Add column(s) to the record
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
     * Convert record to JSON-serializable object
     * @returns {Object} Object with table, columns, and values
     */
    ToJSON() {
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

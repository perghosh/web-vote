class DBRecord {
   static column = class {
      /**
       * @param {Object|string} options_ - Either a configuration object or the column name string
       * @param {string} options_.sName
       * @param {string} [options_.sAlias]
       * @param {string} [options_.sType="unknown"]
       * @param {number} [options_.iState=0]
       * @param {number} [options_.iSpecificType=0]
       * @param {number} [options_.bKey=false]
       * @param {number} [options_.bFKey=false]
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

      // ## Use Map for O(1) value lookups instead of array ..................
      this.mapValues = new Map();

      // ## Cache key columns for performance ................................
      this._aKeyColumns = null;

      // ## Initialize with provided values if any ...........................
      if(options_.aValues) { options_.aValues.forEach(value_ => this.AddValue(value_)); }
   }

   get table() { return this.sTable; }

   AddValue(value_) {
      // ## Convert to array if not already
      if(value_.constructor === Object) {
         Object.keys(value_).forEach(key => this.aValues.push( {name: key, value: value_[key]})); // iterate all key values in object and add to array
      }
      else if(Array.isArray(value_)) { this.aValues.push(...value_); }
      else {
         this.aValues.push(value_);
      }
   }

   SetValue(name_, value_) {
      let sName = name_.constructor === Object ? name_.sName : name_;
      value_ = name_.constructor === Object ? name_.value : value_;

      const oColumn = this._get_column(sName);                                                     console.assert( oColumn, "Column ${sName} not found" );

      const iIndex = this._get_value_index(sName);
      if(iIndex !== -1) { this.aValues[iIndex].value = value_; }
      else { this.aValues.push({name: sName, value: value_}); }
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
   ClearValues() { this.mapValues.clear(); }

   /** ------------------------------------------------------------------------
    * Get the key value (works when there's exactly one key column)
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

      return aKeyColumns.some(column => this.mapValues.has(column.sName));
   }

   /** ------------------------------------------------------------------------
    * Get all column names
    * @returns {Array<string>} Array of column names
    */
   GetColumnNames() { return this.aColumn.map(column => column.sName); }

    /** ------------------------------------------------------------------------
     * Convert record to JSON-serializable object
     * @returns {Object} Object with table, columns, and values
     */
    ToJSON() {
       return {
          sTable: this.sTable,
          aColumn: this.aColumn.map(col => ({
             sName: col.sName,
             sAlias: col.sAlias,
             sType: col.sType,
             iState: col.iState,
             iSpecificType: col.iSpecificType,
             bKey: col.bKey,
             bFKey: col.bFKey
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

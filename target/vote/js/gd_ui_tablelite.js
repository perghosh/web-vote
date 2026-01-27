// @FILE [tag: table] [description: Lightweight UI class for rendering Table data with customizable columns and styling] [name: gd_ui_table_lite.js]

/**
 * UITableLite - A lightweight class for rendering Table data as HTML tables.
 *
 * **Quick Start:**
 * ```javascript
 * // Create table renderer
 * const table = new Table(["Name", "Age", "Email"]);
 * table.Add(["John", 30, "john@example.com"]);
 * table.Add(["Jane", 25, "jane@example.com"]);
 *
 * const uiTable = new UITableLite(document.body, table, {
 *    aColumns: [0, 1, 2], // Show all columns
 *    bHeader: true
 * });
 *
 * uiTable.Render();
 * ```
 *
 * **Key Concepts:**
 * - **Column Selection:** Choose which columns to render using indices or names
 * - **Row Callbacks:** Customize rendering with callbacks that receive row data
 * - **Class Customization:** Set CSS classes for table, rows, cells, and headers
 * - **Auto-Update:** Refresh table content when source data changes
 *
 * **Common Methods:**
 * - `Render()` - Render or re-render the table
 * - `Update()` - Refresh table content from source data
 * - `SetColumns(columns)` - Change which columns are displayed
 * - `Destroy()` - Remove table from DOM and clean up
 *
 * @param {HTMLElement|string} parent_ - The parent container element or selector.
 * @param {Table} table_ - The Table instance to render data from.
 * @param {Object} [options_={}] - Configuration options.
 * @param {Array<number|string>} [options_.aColumns=null] - Array of column indices or names to render (null = all columns).
 * @param {boolean} [options_.bHeader=true] - Whether to render header row.
 * @param {boolean} [options_.bIndex=false] - Whether to include row index column.
 * @param {boolean} [options_.bIndices=false] - Whether to retrieve and pass original row indices to callbacks.
 * @param {number} [options_.iSort=0] - Column to sort by (positive=ascending, negative=descending).
 * @param {Function} [options_.fnCallback] - Single callback for all customization: (sCommand, oData) => any.
 *   Commands:
 *   - "row": Customize row element. oData: { aRow, iIndex, iOriginalIndex, eRow }
 *   - "cell": Customize cell content. oData: { value, iColumn, iRow, iOriginalIndex, eCell }. Return string/HTMLElement to override content.
 *   - "row_class": Set row classes. oData: { aRow, iIndex, iOriginalIndex }. Return string|Array<string>.
 *   - "cell_class": Set cell classes. oData: { value, iColumn, iRow, iOriginalIndex }. Return string|Array<string>.
 * @param {Object} [options_.oStyle] - CSS class names for styling.
 * @param {string} [options_.oStyle.table=''] - Class for table element.
 * @param {string} [options_.oStyle.thead=''] - Class for thead element.
 * @param {string} [options_.oStyle.tbody=''] - Class for tbody element.
 * @param {string} [options_.oStyle.tr=''] - Class for tr elements.
 * @param {string} [options_.oStyle.th=''] - Class for th elements.
 * @param {string} [options_.oStyle.td=''] - Class for td elements.
 */
class UITableLite {

   constructor(parent_, table_, options_ = {}) {
      // ## Resolve parent element ............................................
      const eParent = typeof parent_ === "string"
         ? document.querySelector(parent_) ?? document.getElementById(parent_)
         : parent_;

      if(!eParent) { throw new Error('UITableLite: Parent element not found'); }
      if( !(table_ instanceof Table) ) { throw new Error('UITableLite: Invalid Table instance'); }

      // Store references
      this.eParent = eParent;
      this.table = table_;

      // ## Apply options with defaults .......................................
      this.oOptions = Object.assign({
         // null = all columns
         aColumns: null, bHeader: false, bIndex: false, iSort: 0, fnCallback: null,
         oStyle: { table: '', thead: '', tbody: '', tr: '', th: '', td: '' }
      }, options_);

      // Merge style options
      if( options_.oStyle ) {
         Object.assign(this.oOptions.oStyle, options_.oStyle);
      }

      // Store table element reference
      this.eTable = null;
   }

   /** -----------------------------------------------------------------------
    * Render the table into the parent container.
    * Creates a new table element and populates it with data from the Table instance.
    * @param {Table} [oTable] - The Table instance to render.
    * @returns {HTMLElement} The rendered table element.
    */
   Render(oTable = this.table) {
      if(!(oTable instanceof Table)) { throw new Error('Render: Invalid Table instance'); }

      // ## Remove existing table if present ..................................
      this.eTable?.parentNode?.removeChild(this.eTable);

      // ## Create table element ..............................................
      this.eTable = document.createElement('table');
      if( this.oOptions.oStyle.table ) {  this._add_classes(this.eTable, this.oOptions.oStyle.table); }

      // ## Get data from Table instance ......................................
      const oGetDataOptions = {
         bHeader: this.oOptions.bHeader,
         bIndex: this.oOptions.bIndex,
         iSort: this.oOptions.iSort,
         aColumn: this.oOptions.aColumns,
         bIndices: this.oOptions.bIndices,
      };

      const aGetDataResult = oTable.GetData(oGetDataOptions);

      // Check if GetData returned two arrays (data and indices) or one (just data)
      const aData = this.oOptions.bIndices ? aGetDataResult[0] : aGetDataResult;
      const aIndices = this.oOptions.bIndices ? aGetDataResult[1] : null;

      if( aData.length === 0 ) {
         // Empty table
         this.eParent.appendChild(this.eTable);
         return this.eTable;
      }

      // ## Render header if present ..........................................
      let iStart = 0;
      if( this.oOptions.bHeader && aData.length > 0 ) {
         const eThead = this._create_thead(aData[0]);
         this.eTable.appendChild(eThead);
         iStart = 1;
      }

      // ## Render body rows ..................................................
      const eTbody = this._create_tbody(aData, iStart, aIndices);
      this.eTable.appendChild(eTbody);

      // ## Append to parent ..................................................
      this.eParent.appendChild(this.eTable);

      return this.eTable;
   }

   /** -----------------------------------------------------------------------
    * Update the table content by re-rendering with current data.
    * Useful when the underlying Table data has changed.
    * @returns {HTMLElement} The updated table element.
    */
   Update() { return this.Render(); }

   /** -----------------------------------------------------------------------
    * Set which columns to display and re-render.
    * @param {Array<number|string>} aColumns - Array of column indices or names (null = all columns).
    * @returns {HTMLElement} The updated table element.
    */
   SetColumns(aColumns) {
      this.oOptions.aColumns = aColumns;
      return this.Render();
   }

   /** -----------------------------------------------------------------------
    * Set sorting column and re-render.
    * @param {number} iSort - Column index to sort by (positive=asc, negative=desc, 0=none).
    * @returns {HTMLElement} The updated table element.
    */
   SetSort(iSort) {
      this.oOptions.iSort = iSort;
      return this.Render();
   }

   /** -----------------------------------------------------------------------
    * Toggle header visibility and re-render.
    * @param {boolean} bShow - Whether to show header.
    * @returns {HTMLElement} The updated table element.
    */
   ToggleHeader(bShow) {
      this.oOptions.bHeader = bShow;
      return this.Render();
   }

   /** -----------------------------------------------------------------------
    * Get the table element.
    * @returns {HTMLElement|null} The table element or null if not rendered.
    */
   GetElement() { return this.eTable; }

   /** -----------------------------------------------------------------------
    * Destroy the table and remove it from DOM.
    */
   Destroy() {
      if( this.eTable && this.eTable.parentNode ) {
         this.eTable.parentNode.removeChild(this.eTable);
      }

      // Clear references
      this.eTable = null;
      this.table = null;
      this.eParent = null;
   }

   /** -----------------------------------------------------------------------
    * Create thead element with header row.
    * @param {Array} aHeader - Header row data.
    * @returns {HTMLElement} The thead element.
    * @private
    */
   _create_thead(aHeader) {
      const eThead = document.createElement('thead');
      if( this.oOptions.oStyle.thead ) { this._add_classes(eThead, this.oOptions.oStyle.thead); }

      const eTr = document.createElement('tr');
      if( this.oOptions.oStyle.tr ) { this._add_classes(eTr, this.oOptions.oStyle.tr); }

      // ## Create header cells ...............................................
      for( let i = 0; i < aHeader.length; i++ ) {
         const eTh = document.createElement('th');
         if( this.oOptions.oStyle.th ) {
            this._add_classes(eTh, this.oOptions.oStyle.th);
         }

         eTh.textContent = aHeader[i];
         eTr.appendChild(eTh);
      }

      eThead.appendChild(eTr);
      return eThead;
   }

   /** -----------------------------------------------------------------------
    * Create tbody element with data rows.
    * @param {Array<Array>} aData - 2D array of table data.
    * @param {number} iStart - Index to start reading data from.
    * @param {Array<number>|null} aIndices - Array of original row indices (null if not available).
    * @returns {HTMLElement} The tbody element.
    * @private
    */
   _create_tbody(aData, iStart, aIndices = null) {
      const eTbody = document.createElement('tbody');
      if(this.oOptions.oStyle.tbody) { this._add_classes(eTbody, this.oOptions.oStyle.tbody);  }

      for(let iRow = iStart; iRow < aData.length; iRow++) {
         const aRow = aData[iRow];
         const iActualRow = iRow - iStart;
         const iOriginalIndex = aIndices ? aIndices[iRow - iStart] : iActualRow;

         const eTr = document.createElement('tr'); // create table row element
         this._add_classes(eTr, this.oOptions.oStyle.tr);

         this._apply_row_classes(eTr, aRow, iActualRow, iOriginalIndex);

         for(let iCol = 0; iCol < aRow.length; iCol++) {
            const eTd = document.createElement('td'); // create table cell element
            this._add_classes(eTd, this.oOptions.oStyle.td);

            this._apply_cell_classes(eTd, aRow[iCol], iCol, iActualRow, iOriginalIndex);
            this._apply_cell_content(eTd, aRow[iCol], iCol, iActualRow, iOriginalIndex);

            eTr.appendChild(eTd);
         }

         this._get_callback_result("row", { aRow, iIndex: iActualRow, iOriginalIndex, eRow: eTr });

         eTbody.appendChild(eTr);
      }

      return eTbody;
   }

   /** -----------------------------------------------------------------------
    * Add CSS classes to an element from string or array.
    * @param {HTMLElement} element_ - The element to add classes to.
    * @param {string|Array<string>} classes_ - Classes as string (space-separated) or array.
    * @private
    */
   _add_classes(element_, classes_) {
      if( !classes_ ) return;                                                 // return early if no classes provided

      if( Array.isArray(classes_) ) {
         classes_.forEach(sClass => {
            if( sClass ) element_.classList.add(sClass);
         });
      }
      else if( typeof classes_ === 'string' ) {
         const aClasses = classes_.split(' ').filter(s => s.length > 0);
         aClasses.forEach(sClass => element_.classList.add(sClass));
      }
   }

   // Helper to safely call the callback
   _get_callback_result(command, data) {
      if(!this.oOptions.fnCallback) return undefined;                         // return early if no callback provided
      return this.oOptions.fnCallback(command, data);
   }

   // Apply custom row classes
   _apply_row_classes(eTr, aRow, iActualRow, iOriginalIndex) {
      const classes = this._get_callback_result("row_class", { aRow, iIndex: iActualRow, iOriginalIndex });
      if(classes) this._add_classes(eTr, classes);
   }

   // Apply custom cell classes
   _apply_cell_classes(eTd, value, iColumn, iRow, iOriginalIndex) {
      const classes = this._get_callback_result("cell_class", { value, iColumn, iRow, iOriginalIndex });
      if(classes) this._add_classes(eTd, classes);
   }

   // Handle cell content + callback override
   _apply_cell_content(eTd, value, iColumn, iRow, iOriginalIndex) {
      let content = value;

      const result = this._get_callback_result("cell", { value, iColumn, iRow, iOriginalIndex, eCell: eTd });

      if(result !== undefined && result !== null) { content = result; }

      if(typeof content === 'string' || typeof content === 'number') {
         eTd.textContent = content;
      } else if(content instanceof HTMLElement) {
         eTd.appendChild(content);
      } else if(content != null) {
         eTd.textContent = String(content);
      }
   }
}

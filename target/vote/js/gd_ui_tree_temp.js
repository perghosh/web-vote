// @FILE [tag: tree] [description: Object to produce tree control for database table relationships with multi-root support] [name: gd_ui_tree.js]

/**
 * Class to create and manage a multi-root tree control for database relationships.
 *
 * This tree control is designed for displaying hierarchical data from database tables
 * where records can have children from related tables. Unlike traditional trees with
 * a single root, this supports multiple root nodes (a "core tribe") making it ideal
 * for showing related table records side by side.
 *
 * **Quick Start:**
 * ```javascript
 * // Create tree manager
 * const tree = new UITree(document.body, {
 *    sTheme: 'corporate-blue',
 *    bShowLines: true,
 *    bExpandAll: false,
 *    fnCallback: (sEvent, oNode) => {
 *       console.log(`Event: ${sEvent}`, oNode);
 *       // sEvent can be: 'select', 'expand', 'collapse', 'lazyload'
 *    }
 * });
 *
 * // Add root nodes (table records)
 * tree.AddRoot({
 *    sId: 'customer_001',
 *    sLabel: 'Customer: Acme Corp',
 *    sType: 'primary',
 *    oData: { table: 'customers', id: 1 }
 * });
 *
 * // Add child nodes (related records)
 * tree.AddChild('customer_001', {
 *    sId: 'order_123',
 *    sLabel: 'Order #123',
 *    sType: 'success',
 *    oData: { table: 'orders', id: 123 }
 * });
 *
 * // Expand/collapse nodes
 * tree.Expand('customer_001');
 * tree.Collapse('customer_001');
 * ```
 *
 * **Key Concepts:**
 * - **Multi-Root**: Multiple independent root nodes forming a "core tribe"
 * - **Lazy Loading**: Children can be loaded on demand via callback (event: 'lazyload')
 * - **Database Mapping**: Each node stores table/record metadata in oData
 * - **Theming**: Uses CSS variables for consistent styling
 * - **Selection**: Single or multi-select with keyboard navigation
 *
 * **Supported Types:**
 * - 'primary' (default), 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'
 *
 * **Callback Events:**
 * - `'select'` - Node was selected
 * - `'expand'` - Node was expanded
 * - `'collapse'` - Node was collapsed
 * - `'lazyload'` - Lazy loading requested for node (call fnCallback with array)
 *
 * @param {HTMLElement|string} parent_ - The parent container element or selector.
 * @param {Object} [options_={}] - Configuration options.
 * @param {string} [options_.sTheme='primary'] - Default theme color for nodes.
 * @param {boolean} [options_.bShowLines=true] - Show connecting lines between nodes.
 * @param {boolean} [options_.bExpandAll=false] - Expand all nodes by default.
 * @param {boolean} [options_.bMultiSelect=false] - Allow multiple node selection.
 * @param {boolean} [options_.bShowIcons=true] - Show expand/collapse icons.
 * @param {Function} [options_.fnCallback] - Callback for all events: fn(sEvent, oNode, oData).
 * @param {Object} [options_.oStyle] - CSS class names for custom styling.
 * @param {string} [options_.oStyle.container] - Class for tree container.
 * @param {string} [options_.oStyle.node] - Class for node elements.
 * @param {string} [options_.oStyle.content] - Class for node content area.
 * @param {string} [options_.oStyle.children] - Class for children container.
 * @param {string} [options_.oStyle.icon] - Class for expand/collapse icon.
 * @param {string} [options_.oStyle.line] - Class for connecting lines.
 */
class UITree {

   constructor(parent_, oOptions_ = {}) {
      let eParent;
      if( typeof parent_ === "string" ) {
         eParent = document.querySelector(parent_);
         if( !eParent ) eParent = document.getElementById(parent_);
      }
      else {
         eParent = parent_;
      }

      if( !eParent ) { throw new Error('UITree: Parent not found'); }

      // Store parent element
      this.eParent = eParent;

      // Apply options with defaults
      this.oOptions = Object.assign({
         sTheme: 'primary', bShowLines: true, bExpandAll: false, bMultiSelect: false, bShowIcons: true, fnCallback: null,
         oStyle: { container: null, node: null, content: null, children: null, icon: null, line: null }
      }, oOptions_);

      this.oStyle = this.oOptions.oStyle;

      // Store node registry for quick lookup
      this.oNodes = {};

      // Store root node IDs
      this.aRoots = [];

      // Store selected node IDs
      this.aSelected = [];

      // Create container element
      this.eContainer = document.createElement('div');
      this.eContainer.setAttribute('data-tree-container', '');

      // Apply base container styles
      this._apply_container_styles();

      // Apply user-defined container class
      if( this.oStyle.container ) {
         this.eContainer.classList.add(this.oStyle.container);
      }

      // Append container to parent
      this.eParent.appendChild(this.eContainer);
   }

   /** -----------------------------------------------------------------------
    * Add a root node to the tree.
    * @param {Object} oNodeData - Node configuration.
    * @param {string} oNodeData.sId - Unique identifier for the node.
    * @param {string} oNodeData.sLabel - Display text for the node (can be HTML).
    * @param {string} [oNodeData.sType] - Node type/theme (overrides default).
    * @param {Object} [oNodeData.oData={}] - Custom data (table, record id, etc.).
    * @param {boolean} [oNodeData.bExpanded=false] - Initial expanded state.
    * @param {boolean} [oNodeData.bHasChildren=false] - Whether node has children.
    * @param {Array} [oNodeData.aChildren] - Initial children to add.
    * @returns {string} The node ID.
    */
   AddRoot(oNodeData) {
      // ## Validate required fields .........................................
      if( !oNodeData.sId ) { throw new Error('UITree: Root node requires sId'); }
      if( this.oNodes[oNodeData.sId] ) { throw new Error(`UITree: Node ${oNodeData.sId} already exists`); }

      // Create node object
      const oNode = this._create_node_object(oNodeData);

      // Add to registry and roots array
      this.oNodes[oNodeData.sId] = oNode;
      this.aRoots.push(oNodeData.sId);

      // Create DOM element
      const eNode = this._create_node_element(oNode);
      oNode.eElement = eNode;

      // Append to container
      this.eContainer.appendChild(eNode);

      // ## Handle initial expansion .........................................
      if( oNodeData.bExpanded || this.oOptions.bExpandAll ) {
         this.Expand(oNodeData.sId);
      }

      // ## Add initial children if provided .................................
      if( oNodeData.aChildren && Array.isArray(oNodeData.aChildren) ) {
         oNodeData.aChildren.forEach(oChild => {
            this.AddChild(oNodeData.sId, oChild);
         });
      }

      return oNodeData.sId;
   }

   /** -----------------------------------------------------------------------
    * Add a child node to an existing node.
    * @param {string} sParentId - ID of the parent node.
    * @param {Object} oNodeData - Node configuration (same as AddRoot).
    * @returns {string} The child node ID.
    */
   AddChild(sParentId, oNodeData) {
      // ## Validate parent exists ...........................................
      const oParent = this.oNodes[sParentId];
      if( !oParent ) { throw new Error(`UITree: Parent node ${sParentId} not found`); }

      // ## Validate child fields ............................................
      if( !oNodeData.sId ) { throw new Error('UITree: Child node requires sId'); }
      if( this.oNodes[oNodeData.sId] ) { throw new Error(`UITree: Node ${oNodeData.sId} already exists`); }

      // Create node object
      const oNode = this._create_node_object(oNodeData);
      oNode.sParentId = sParentId;

      // Add to registry
      this.oNodes[oNodeData.sId] = oNode;

      // Add to parent's children array
      oParent.aChildren.push(oNodeData.sId);
      oParent.bHasChildren = true;

      // Update parent visual state
      this._update_parent_state(oParent);

      // Create DOM element
      const eNode = this._create_node_element(oNode);
      oNode.eElement = eNode;

      // ## Append to parent's children container ............................
      let eChildren = oParent.eElement.querySelector('[data-tree-children]');
      if( !eChildren ) {
         eChildren = this._create_children_container(oParent);
         oParent.eElement.appendChild(eChildren);
      }
      eChildren.appendChild(eNode);

      // ## Handle initial expansion .........................................
      if( oNodeData.bExpanded || this.oOptions.bExpandAll ) {
         this.Expand(oNodeData.sId);
      }

      // ## Add initial children if provided .................................
      if( oNodeData.aChildren && Array.isArray(oNodeData.aChildren) ) {
         oNodeData.aChildren.forEach(oChild => {
            this.AddChild(oNodeData.sId, oChild);
         });
      }

      return oNodeData.sId;
   }

   /** -----------------------------------------------------------------------
    * Remove a node and all its children from the tree.
    * @param {string} sNodeId - ID of the node to remove.
    * @returns {boolean} True if removed successfully.
    */
   Remove(sNodeId) {
      const oNode = this.oNodes[sNodeId];
      if( !oNode ) { return false; }

      // ## Remove from parent's children array ..............................
      if( oNode.sParentId ) {
         const oParent = this.oNodes[oNode.sParentId];
         if( oParent ) {
            const iIndex = oParent.aChildren.indexOf(sNodeId);
            if( iIndex > -1 ) { oParent.aChildren.splice(iIndex, 1); }
            if( oParent.aChildren.length === 0 ) {
               oParent.bHasChildren = false;
               this._update_parent_state(oParent);
            }
         }
      }
      else {
         // Remove from roots array
         const iIndex = this.aRoots.indexOf(sNodeId);
         if( iIndex > -1 ) { this.aRoots.splice(iIndex, 1); }
      }

      // ## Remove from selection if selected ................................
      this.Deselect(sNodeId);

      // ## Recursively remove all children ..................................
      this._remove_children_recursive(sNodeId);

      // ## Remove DOM element ...............................................
      if( oNode.eElement && oNode.eElement.parentNode ) {
         oNode.eElement.parentNode.removeChild(oNode.eElement);
      }

      // Remove from registry
      delete this.oNodes[sNodeId];

      return true;
   }

   /** -----------------------------------------------------------------------
    * Expand a node to show its children.
    * @param {string} sNodeId - ID of the node to expand.
    * @returns {boolean} True if expanded successfully.
    */
   Expand(sNodeId) {
      const oNode = this.oNodes[sNodeId];
      if( !oNode ) { return false; }

      // ## Check for lazy loading ...........................................
      if( oNode.bLazy && !oNode.bLoaded && this.oOptions.fnCallback ) {
         this._load_lazy_children(oNode);
         return true;
      }

      // ## Create children container if needed ..............................
      let eChildren = oNode.eElement.querySelector('[data-tree-children]');
      if( !eChildren && oNode.aChildren.length > 0 ) {
         eChildren = this._create_children_container(oNode);
         oNode.eElement.appendChild(eChildren);

         // Create child elements
         oNode.aChildren.forEach(sChildId => {
            const oChild = this.oNodes[sChildId];
            if( oChild ) {
               const eChild = this._create_node_element(oChild);
               oChild.eElement = eChild;
               eChildren.appendChild(eChild);
            }
         });
      }

      // ## Update visual state ..............................................
      if( eChildren ) {
         eChildren.style.display = 'block';
      }
      oNode.bExpanded = true;
      this._update_node_icon(oNode);

      // ## Trigger callback .................................................
      this._trigger_callback('expand', oNode);

      return true;
   }

   /** -----------------------------------------------------------------------
    * Collapse a node to hide its children.
    * @param {string} sNodeId - ID of the node to collapse.
    * @returns {boolean} True if collapsed successfully.
    */
   Collapse(sNodeId) {
      const oNode = this.oNodes[sNodeId];
      if( !oNode ) { return false; }

      // ## Hide children container ..........................................
      const eChildren = oNode.eElement.querySelector('[data-tree-children]');
      if( eChildren ) {
         eChildren.style.display = 'none';
      }

      oNode.bExpanded = false;
      this._update_node_icon(oNode);

      // ## Trigger callback .................................................
      this._trigger_callback('collapse', oNode);

      return true;
   }

   /** -----------------------------------------------------------------------
    * Toggle a node's expanded/collapsed state.
    * @param {string} sNodeId - ID of the node to toggle.
    * @returns {boolean} True if toggled successfully.
    */
   Toggle(sNodeId) {
      const oNode = this.oNodes[sNodeId];
      if( !oNode ) { return false; }

      if( oNode.bExpanded ) {
         return this.Collapse(sNodeId);
      }
      else {
         return this.Expand(sNodeId);
      }
   }

   /** -----------------------------------------------------------------------
    * Expand all nodes in the tree.
    */
   ExpandAll() {
      Object.keys(this.oNodes).forEach(sNodeId => {
         this.Expand(sNodeId);
      });
   }

   /** -----------------------------------------------------------------------
    * Collapse all nodes in the tree.
    */
   CollapseAll() {
      Object.keys(this.oNodes).forEach(sNodeId => {
         this.Collapse(sNodeId);
      });
   }

   /** -----------------------------------------------------------------------
    * Select a node.
    * @param {string} sNodeId - ID of the node to select.
    * @param {boolean} [bAddToSelection=false] - Add to multi-selection.
    * @returns {boolean} True if selected successfully.
    */
   Select(sNodeId, bAddToSelection = false) {
      const oNode = this.oNodes[sNodeId];
      if( !oNode ) { return false; }

      // ## Clear previous selection if not multi-select .....................
      if( !this.oOptions.bMultiSelect && !bAddToSelection ) {
         this.ClearSelection();
      }

      // ## Add to selection .................................................
      if( !this.aSelected.includes(sNodeId) ) {
         this.aSelected.push(sNodeId);
      }

      // ## Update visual state ..............................................
      const eContent = oNode.eElement.querySelector('[data-tree-content]');
      if( eContent ) {
         eContent.classList.add('tree-selected');
         eContent.style.backgroundColor = this._get_type_style(oNode.sType || this.oOptions.sTheme, 'background');
         eContent.style.color = this._get_type_style(oNode.sType || this.oOptions.sTheme, 'color');
      }

      // ## Trigger callback .................................................
      this._trigger_callback('select', oNode);

      return true;
   }

   /** -----------------------------------------------------------------------
    * Deselect a node.
    * @param {string} sNodeId - ID of the node to deselect.
    * @returns {boolean} True if deselected successfully.
    */
   Deselect(sNodeId) {
      const oNode = this.oNodes[sNodeId];
      if( !oNode ) { return false; }

      // ## Remove from selection array ......................................
      const iIndex = this.aSelected.indexOf(sNodeId);
      if( iIndex > -1 ) { this.aSelected.splice(iIndex, 1); }

      // ## Update visual state ..............................................
      const eContent = oNode.eElement.querySelector('[data-tree-content]');
      if( eContent ) {
         eContent.classList.remove('tree-selected');
         eContent.style.backgroundColor = '';
         eContent.style.color = '';
      }

      return true;
   }

   /** -----------------------------------------------------------------------
    * Clear all selections.
    */
   ClearSelection() {
      const aSelectedCopy = [...this.aSelected];
      aSelectedCopy.forEach(sNodeId => {
         this.Deselect(sNodeId);
      });
   }

   /** -----------------------------------------------------------------------
    * Get the currently selected node(s).
    * @returns {Object|Array|null} Selected node object, array if multi-select, or null.
    */
   GetSelected() {
      if( this.aSelected.length === 0 ) { return null; }
      if( this.oOptions.bMultiSelect ) {
         return this.aSelected.map(sId => this.oNodes[sId]);
      }
      return this.oNodes[this.aSelected[0]];
   }

   /** -----------------------------------------------------------------------
    * Get a node by ID.
    * @param {string} sNodeId - The node ID.
    * @returns {Object|null} The node object or null.
    */
   GetNode(sNodeId) {
      return this.oNodes[sNodeId] || null;
   }

   /** -----------------------------------------------------------------------
    * Get all root nodes.
    * @returns {Array} Array of root node objects.
    */
   GetRoots() {
      return this.aRoots.map(sId => this.oNodes[sId]);
   }

   /** -----------------------------------------------------------------------
    * Get children of a node.
    * @param {string} sNodeId - The parent node ID.
    * @returns {Array} Array of child node objects.
    */
   GetChildren(sNodeId) {
      const oNode = this.oNodes[sNodeId];
      if( !oNode ) { return []; }
      return oNode.aChildren.map(sId => this.oNodes[sId]);
   }

   /** -----------------------------------------------------------------------
    * Update node data.
    * @param {string} sNodeId - The node ID to update.
    * @param {Object} oUpdates - Properties to update.
    * @returns {boolean} True if updated successfully.
    */
   Update(sNodeId, oUpdates) {
      const oNode = this.oNodes[sNodeId];
      if( !oNode ) { return false; }

      // ## Update allowed properties ........................................
      if( oUpdates.sLabel !== undefined ) {
         oNode.sLabel = oUpdates.sLabel;
         const eContent = oNode.eElement.querySelector('[data-tree-content]');
         if( eContent ) {
            eContent.innerHTML = oUpdates.sLabel;
         }
      }

      if( oUpdates.sType !== undefined ) {
         oNode.sType = oUpdates.sType;
         this._update_node_styles(oNode);
      }

      if( oUpdates.oData !== undefined ) {
         oNode.oData = Object.assign(oNode.oData, oUpdates.oData);
      }

      if( oUpdates.bHasChildren !== undefined ) {
         oNode.bHasChildren = oUpdates.bHasChildren;
         this._update_parent_state(oNode);
      }

      return true;
   }

   /** -----------------------------------------------------------------------
    * Destroy the tree and clean up all nodes.
    */
   Destroy() {
      // ## Remove all nodes .................................................
      this.aRoots.slice().forEach(sRootId => {
         this.Remove(sRootId);
      });

      // ## Remove container from DOM ........................................
      if( this.eContainer && this.eContainer.parentNode ) {
         this.eContainer.parentNode.removeChild(this.eContainer);
      }

      // ## Clear references .................................................
      this.oNodes = {};
      this.aRoots = [];
      this.aSelected = [];
      this.eContainer = null;
      this.eParent = null;
   }

   /** -----------------------------------------------------------------------
    * Apply base container styles.
    * @private
    */
   _apply_container_styles() {
      this.eContainer.style.fontFamily = 'inherit';
      this.eContainer.style.fontSize = '14px';
      this.eContainer.style.lineHeight = '1.5';
      this.eContainer.style.userSelect = 'none';
   }

   /** -----------------------------------------------------------------------
    * Create a node object from data.
    * @param {Object} oNodeData - Node configuration.
    * @returns {Object} Node object.
    * @private
    */
   _create_node_object(oNodeData) {
      return {
         sId: oNodeData.sId,
         sLabel: oNodeData.sLabel || '',
         sType: oNodeData.sType || this.oOptions.sTheme,
         oData: oNodeData.oData || {},
         sParentId: null,
         aChildren: [],
         bExpanded: oNodeData.bExpanded || false,
         bHasChildren: oNodeData.bHasChildren || false,
         bLazy: oNodeData.bLazy || false,
         bLoaded: false,
         eElement: null
      };
   }

   /** -----------------------------------------------------------------------
    * Create a node DOM element.
    * @param {Object} oNode - Node object.
    * @returns {HTMLElement} The node element.
    * @private
    */
   _create_node_element(oNode) {
      const eNode = document.createElement('div');
      eNode.setAttribute('data-tree-node', oNode.sId);
      eNode.style.position = 'relative';

      // ## Create content wrapper ...........................................
      const eContent = document.createElement('div');
      eContent.setAttribute('data-tree-content', '');
      eContent.innerHTML = oNode.sLabel;

      if( this.oStyle.content ) { eContent.classList.add(this.oStyle.content); }

      // ### Apply content styles ............................................
      eContent.style.display = 'flex';
      eContent.style.alignItems = 'center';
      eContent.style.padding = '6px 8px';
      eContent.style.cursor = 'pointer';
      eContent.style.borderRadius = '3px';
      eContent.style.transition = 'background-color 0.2s ease';

      // ### Add icon if enabled .............................................
      if( this.oOptions.bShowIcons ) {
         const eIcon = document.createElement('span');
         eIcon.setAttribute('data-tree-icon', '');
         if( this.oStyle.icon ) { eIcon.classList.add(this.oStyle.icon); }

         eIcon.style.display = 'inline-flex';
         eIcon.style.alignItems = 'center';
         eIcon.style.justifyContent = 'center';
         eIcon.style.width = '16px';
         eIcon.style.height = '16px';
         eIcon.style.marginRight = '6px';
         eIcon.style.fontSize = '10px';
         eIcon.style.cursor = oNode.bHasChildren ? 'pointer' : 'default';
         eIcon.style.opacity = oNode.bHasChildren ? '1' : '0';

         this._update_icon_symbol(eIcon, oNode.bExpanded);

         // #### Icon click handler .........................................
         if( oNode.bHasChildren ) {
            eIcon.addEventListener('click', (e) => {
               e.stopPropagation();
               this.Toggle(oNode.sId);
            });
         }

         eContent.appendChild(eIcon);
         oNode.eIcon = eIcon;
      }

      // ### Content click handler ...........................................
      eContent.addEventListener('click', () => {
         this.Select(oNode.sId);
      });

      // ### Content hover effects ...........................................
      eContent.addEventListener('mouseenter', () => {
         if( !eContent.classList.contains('tree-selected') ) {
            eContent.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
         }
      });

      eContent.addEventListener('mouseleave', () => {
         if( !eContent.classList.contains('tree-selected') ) {
            eContent.style.backgroundColor = '';
         }
      });

      eNode.appendChild(eContent);

      // ## Add connecting line if enabled ...................................
      if( this.oOptions.bShowLines && oNode.sParentId ) {
         const eLine = document.createElement('div');
         eLine.setAttribute('data-tree-line', '');
         if( this.oStyle.line ) { eLine.classList.add(this.oStyle.line); }

         eLine.style.position = 'absolute';
         eLine.style.left = '7px';
         eLine.style.top = '0';
         eLine.style.bottom = '0';
         eLine.style.width = '1px';
         eLine.style.backgroundColor = 'var(--color-border, #dee2e6)';

         eNode.appendChild(eLine);
      }

      if( this.oStyle.node ) { eNode.classList.add(this.oStyle.node); }

      return eNode;
   }

   /** -----------------------------------------------------------------------
    * Create children container for a node.
    * @param {Object} oParent - Parent node object.
    * @returns {HTMLElement} Children container element.
    * @private
    */
   _create_children_container(oParent) {
      const eChildren = document.createElement('div');
      eChildren.setAttribute('data-tree-children', '');

      if( this.oStyle.children ) { eChildren.classList.add(this.oStyle.children); }

      // ### Apply children container styles .................................
      eChildren.style.marginLeft = '16px';
      eChildren.style.position = 'relative';
      eChildren.style.display = oParent.bExpanded ? 'block' : 'none';

      return eChildren;
   }

   /** -----------------------------------------------------------------------
    * Update parent node visual state based on children.
    * @param {Object} oParent - Parent node object.
    * @private
    */
   _update_parent_state(oParent) {
      if( !oParent.eElement ) { return; }

      const eIcon = oParent.eElement.querySelector('[data-tree-icon]');
      if( eIcon ) {
         eIcon.style.opacity = oParent.bHasChildren ? '1' : '0';
         eIcon.style.cursor = oParent.bHasChildren ? 'pointer' : 'default';

         // Update click handler
         eIcon.onclick = oParent.bHasChildren ? (e) => {
            e.stopPropagation();
            this.Toggle(oParent.sId);
         } : null;
      }
   }

   /** -----------------------------------------------------------------------
    * Update node icon based on expanded state.
    * @param {Object} oNode - Node object.
    * @private
    */
   _update_node_icon(oNode) {
      if( oNode.eIcon ) {
         this._update_icon_symbol(oNode.eIcon, oNode.bExpanded);
      }
   }

   /** -----------------------------------------------------------------------
    * Update icon symbol (expand/collapse).
    * @param {HTMLElement} eIcon - Icon element.
    * @param {boolean} bExpanded - Current expanded state.
    * @private
    */
   _update_icon_symbol(eIcon, bExpanded) {
      eIcon.innerHTML = bExpanded ? '&#9660;' : '&#9654;'; // Down or right triangle
   }

   /** -----------------------------------------------------------------------
    * Update node styles after type change.
    * @param {Object} oNode - Node object.
    * @private
    */
   _update_node_styles(oNode) {
      if( this.aSelected.includes(oNode.sId) ) {
         const eContent = oNode.eElement.querySelector('[data-tree-content]');
         if( eContent ) {
            eContent.style.backgroundColor = this._get_type_style(oNode.sType, 'background');
            eContent.style.color = this._get_type_style(oNode.sType, 'color');
         }
      }
   }

   /** -----------------------------------------------------------------------
    * Load lazy children via callback.
    * @param {Object} oNode - Node to load children for.
    * @private
    */
   _load_lazy_children(oNode) {
      if( !this.oOptions.fnCallback ) { return; }

      // ## Show loading state ...............................................
      if( oNode.eIcon ) {
         oNode.eIcon.innerHTML = '&#9679;'; // Loading dot
      }

      // ## Call callback with lazyload event ................................
      this.oOptions.fnCallback('lazyload', oNode, (aChildren) => {
         oNode.bLoaded = true;

         // ### Add loaded children ..........................................
         if( aChildren && Array.isArray(aChildren) ) {
            aChildren.forEach(oChildData => {
               this.AddChild(oNode.sId, oChildData);
            });
         }

         // ### Expand node ..................................................
         this.Expand(oNode.sId);
      });
   }

   /** -----------------------------------------------------------------------
    * Trigger callback with event type.
    * @param {string} sEvent - Event type ('select', 'expand', 'collapse').
    * @param {Object} oNode - Node object.
    * @private
    */
   _trigger_callback(sEvent, oNode) {
      if( this.oOptions.fnCallback && typeof this.oOptions.fnCallback === 'function' ) {
         this.oOptions.fnCallback(sEvent, oNode);
      }
   }

   /** -----------------------------------------------------------------------
    * Recursively remove children nodes.
    * @param {string} sParentId - Parent node ID.
    * @private
    */
   _remove_children_recursive(sParentId) {
      const oParent = this.oNodes[sParentId];
      if( !oParent ) { return; }

      oParent.aChildren.slice().forEach(sChildId => {
         this._remove_children_recursive(sChildId);

         // Deselect if selected
         this.Deselect(sChildId);

         // Remove DOM element
         const oChild = this.oNodes[sChildId];
         if( oChild && oChild.eElement && oChild.eElement.parentNode ) {
            oChild.eElement.parentNode.removeChild(oChild.eElement);
         }

         // Remove from registry
         delete this.oNodes[sChildId];
      });

      oParent.aChildren = [];
   }

   /** -----------------------------------------------------------------------
    * Get CSS variable value for a specific type.
    * @param {string} sType - The node type (e.g., 'success', 'danger').
    * @param {string} sProperty - The CSS property suffix (e.g., 'background', 'color').
    * @returns {string} The CSS variable value.
    * @private
    */
   _get_type_style(sType, sProperty) {
      // Default to primary if type is invalid
      const sValidType = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].includes(sType)
         ? sType
         : 'primary';
      return `var(--${sProperty}-${sValidType})`;
   }

}

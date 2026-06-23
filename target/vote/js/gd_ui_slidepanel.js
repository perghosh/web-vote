// @FILE [tag: slidepanel] [description: UI control for fixed-position sliding panels that can open from any browser edge] [name: gd_ui_slidepanel.js]

/** -----------------------------------------------------------------------
 * @NOTE [tag: slidepanel_usage] [summary: quick usage examples] [description: Small examples for creating and controlling slide panels from all edges]
 *
 * @example
 * // Top edge (content above, handle below)
 * const oTopPanel = new UISlidePanel(document.body, {
 *    sEdgeDirection: 'top',
 *    iPanelWidth: 360,
 *    iContentSize: 160,
 *    iHandleSize: 44,
 *    sHandleText: 'Top Menu',
 *    sContentHtml: '<div class="padding_a-small">Top panel content</div>'
 * });
 *
 * @example
 * // Bottom edge (handle above, content below)
 * const oBottomPanel = new UISlidePanel(document.body, {
 *    sEdgeDirection: 'bottom',
 *    iPanelWidth: 360,
 *    iContentSize: 180,
 *    iHandleSize: 40,
 *    sHandleText: 'Open Bottom Panel',
 *    bStartOpen: true,
 *    sContentHtml: '<div class="padding_a-small">Bottom panel content</div>'
 * });
 *
 * @example
 * // Left edge (content left, handle right)
 * const oLeftPanel = new UISlidePanel(document.body, {
 *    sEdgeDirection: 'left',
 *    iPanelHeight: 320,
 *    iContentSize: 240,
 *    iHandleSize: 52,
 *    sHandleText: 'Tools',
 *    sContentHtml: '<div class="padding_a-small">Left panel content</div>',
 *    bCloseOnOutsideClick: true
 * });
 *
 * @example
 * // Right edge (handle left, content right)
 * const oRightPanel = new UISlidePanel(document.body, {
 *    sEdgeDirection: 'right',
 *    iPanelHeight: 320,
 *    iContentSize: 260,
 *    iHandleSize: 48,
 *    sHandleText: 'Filters',
 *    sContentHtml: '<div class="padding_a-small">Right panel content</div>'
 * });
 *
 * @example
 * // Dynamic updates after creation
 * const oPanel = new UISlidePanel(document.body, {
 *    sEdgeDirection: 'top',
 *    sHandleText: 'Settings'
 * });
 *
 * oPanel.SetContentHtml('<div class="padding_a-small">Updated content</div>');
 * oPanel.SetHandleText('Open Settings');
 * oPanel.Open();
 * oPanel.Close();
 * oPanel.Toggle();
 *
 * @example
 * // Use global defaults via oPanelSettingsg and override per instance
 * const oPanelSettingsg = {
 *    sEdgeDirection: 'left',
 *    iPanelHeight: 360,
 *    iContentSize: 260,
 *    iHandleSize: 46,
 *    sTransitionDuration: '0.4s',
 *    sTransitionTiming: 'ease-in-out',
 *    oStyle: {
 *       sPanelClass: 'slide-panel',
 *       sContentClass: 'slide-panel-content',
 *       sHandleClass: 'slide-panel-handle'
 *    }
 * };
 *
 * const oPanelFromGlobal = new UISlidePanel(document.body, {
 *    sEdgeDirection: 'right',
 *    sHandleText: 'Global + Local Override'
 * });
 */

/** -----------------------------------------------------------------------
 * UISlidePanel - A configurable slide panel that can slide from any edge.
 *
 * **Supported Edges:**
 * - top: Content above, handle below
 * - bottom: Handle above, content below
 * - left: Content left, handle right
 * - right: Handle left, content right
 *
 * **Dynamic Positioning:**
 * - Closed offset is calculated from `iContentSize` so only handle stays visible.
 * - Top/Bottom panels center horizontally: `left: 50%` + `translateX(-50%)`.
 * - Left/Right panels center vertically: `top: 50%` + `translateY(-50%)`.
 *
 * @param {HTMLElement|string} parent_ - Parent container element or selector/id.
 * @param {Object} [oPanelSettings={}] - Panel settings object.
 * @param {string} [oPanelSettings.sEdgeDirection='top'] - Edge direction: top|bottom|left|right.
 * @param {number} [oPanelSettings.iPanelWidth=320] - Width used for top/bottom panels.
 * @param {number} [oPanelSettings.iPanelHeight=320] - Height used for left/right panels.
 * @param {number} [oPanelSettings.iContentSize=180] - Hidden content size along slide axis.
 * @param {number} [oPanelSettings.iHandleSize=42] - Always-visible handle size along slide axis.
 * @param {string} [oPanelSettings.sHandleText='Panel'] - Handle label text.
 * @param {string} [oPanelSettings.sContentHtml=''] - Initial HTML content for content area.
 * @param {boolean} [oPanelSettings.bStartOpen=false] - Initial open state.
 * @param {boolean} [oPanelSettings.bCloseOnOutsideClick=false] - Close panel on outside click.
 * @param {string} [oPanelSettings.sTransitionDuration='0.35s'] - Transition duration.
 * @param {string} [oPanelSettings.sTransitionTiming='ease-in-out'] - Transition easing function.
 * @param {number} [oPanelSettings.iZIndex=1000] - Panel z-index.
 * @param {Object} [oPanelSettings.oStyle] - Optional CSS class names.
 * @param {string} [oPanelSettings.oStyle.sPanelClass=''] - Panel root class.
 * @param {string} [oPanelSettings.oStyle.sContentClass=''] - Panel content class.
 * @param {string} [oPanelSettings.oStyle.sHandleClass=''] - Panel handle class.
 * @param {Function} [oPanelSettings.fnOnToggle=null] - Callback: fnOnToggle(bIsOpen, panelInstance).
 */
class UISlidePanel {

	/** -----------------------------------------------------------------------
	 * Constructor
	 */
	constructor(parent_, oPanelSettings = {}) {
		const eParent = this._resolve_parent(parent_);
		if( !eParent ) { throw new Error('UISlidePanel: Parent not found'); }

		const oGlobalSettings = this._resolve_global_settings();

		this.eParent = eParent;
		this.oPanelSettings = Object.assign({
			sEdgeDirection: 'top',
			iPanelWidth: 320,
			iPanelHeight: 320,
			iContentSize: 180,
			iHandleSize: 42,
			sHandleText: 'Panel',
			sContentHtml: '',
			bStartOpen: false,
			bCloseOnOutsideClick: false,
			sTransitionDuration: '0.35s',
			sTransitionTiming: 'ease-in-out',
			iZIndex: 1000,
			oStyle: {
				sPanelClass: '',
				sContentClass: '',
				sHandleClass: ''
			},
			fnOnToggle: null
		}, oGlobalSettings, oPanelSettings);

		this.oPanelSettings.oStyle = Object.assign({
			sPanelClass: '',
			sContentClass: '',
			sHandleClass: ''
		}, (oGlobalSettings && oGlobalSettings.oStyle) ? oGlobalSettings.oStyle : {}, (oPanelSettings && oPanelSettings.oStyle) ? oPanelSettings.oStyle : {});

		this.bIsOpen = !!this.oPanelSettings.bStartOpen;

		this.ePanel = document.createElement('section');
		this.eContent = document.createElement('div');
		this.eHandle = document.createElement('button');

		this.oBoundHandlers = {
			fnOnHandleClick: this.Toggle.bind(this),
			fnOnDocumentClick: this._on_document_click.bind(this)
		};

		this._build_dom();
		this._apply_layout_for_edge();
		this._apply_visual_styles();
		this._apply_state_position();
		this._bind_events();
	}

	/** -----------------------------------------------------------------------
	 * Open the panel.
	 */
	Open() {
		if( this.bIsOpen ) { return; }
		this.bIsOpen = true;
		this._apply_state_position();
		this._emit_toggle();
	}

	/** -----------------------------------------------------------------------
	 * Close the panel.
	 */
	Close() {
		if( !this.bIsOpen ) { return; }
		this.bIsOpen = false;
		this._apply_state_position();
		this._emit_toggle();
	}

	/** -----------------------------------------------------------------------
	 * Toggle panel open/close state.
	 */
	Toggle() {
		if( this.bIsOpen ) { this.Close(); }
		else { this.Open(); }
	}

	/** -----------------------------------------------------------------------
	 * Update panel settings and refresh layout.
	 * @param {Object} oPanelSettings - Partial settings object.
	 */
	SetSettings(oPanelSettings = {}) {
		this.oPanelSettings = Object.assign(this.oPanelSettings, oPanelSettings);

		if( oPanelSettings.oStyle ) {
			this.oPanelSettings.oStyle = Object.assign(this.oPanelSettings.oStyle, oPanelSettings.oStyle);
		}

		this._apply_layout_for_edge();
		this._apply_visual_styles();
		this._apply_state_position();
	}

	/** -----------------------------------------------------------------------
	 * Set panel content as HTML.
	 * @param {string} sContentHtml - HTML to render inside panel content.
	 */
	SetContentHtml(sContentHtml) {
		this.oPanelSettings.sContentHtml = sContentHtml;
		this.eContent.innerHTML = sContentHtml;
	}

	/** -----------------------------------------------------------------------
	 * Set panel content from element.
	 * @param {HTMLElement} eContent_ - Element to append to content area.
	 */
	SetContentElement(eContent_) {
		this.eContent.innerHTML = '';
		if( eContent_ instanceof HTMLElement ) { this.eContent.appendChild(eContent_); }
	}

	/** -----------------------------------------------------------------------
	 * Set handle text.
	 * @param {string} sHandleText - New handle text.
	 */
	SetHandleText(sHandleText) {
		this.oPanelSettings.sHandleText = sHandleText;
		this.eHandle.textContent = sHandleText;
	}

	/** -----------------------------------------------------------------------
	 * Get root panel element.
	 * @returns {HTMLElement}
	 */
	GetElement() { return this.ePanel; }

	/** -----------------------------------------------------------------------
	 * Destroy panel and cleanup listeners.
	 */
	Destroy() {
		this._unbind_events();
		if( this.ePanel && this.ePanel.parentNode ) { this.ePanel.parentNode.removeChild(this.ePanel); }

		this.ePanel = null;
		this.eContent = null;
		this.eHandle = null;
		this.eParent = null;
	}

	/** -----------------------------------------------------------------------
	 * Resolve parent element from selector, id, or direct element.
	 * @private
	 */
	_resolve_parent(parent_) {
		if( parent_ instanceof HTMLElement ) { return parent_; }
		if( typeof parent_ !== 'string' ) { return null; }

		const eByQuery = document.querySelector(parent_);
		if( eByQuery ) { return eByQuery; }

		return document.getElementById(parent_);
	}

	/** -----------------------------------------------------------------------
	 * Resolve global default settings from `oPanelSettingsg` if present.
	 * @private
	 */
	_resolve_global_settings() {
		if( typeof globalThis !== 'undefined' && globalThis.oPanelSettingsg && typeof globalThis.oPanelSettingsg === 'object' ) {
			return globalThis.oPanelSettingsg;
		}
		return {};
	}

	/** -----------------------------------------------------------------------
	 * Build static DOM nodes and append panel to parent.
	 * @private
	 */
	_build_dom() {
		this.ePanel.setAttribute('data-ui-slidepanel', '');
		this.ePanel.setAttribute('data-edge-direction', this._get_edge_direction());

		this.eContent.setAttribute('data-ui-slidepanel-content', '');
		this.eHandle.setAttribute('data-ui-slidepanel-handle', '');
		this.eHandle.setAttribute('type', 'button');
		this.eHandle.setAttribute('aria-expanded', this.bIsOpen ? 'true' : 'false');

		this.eContent.innerHTML = this.oPanelSettings.sContentHtml || '';
		this.eHandle.textContent = this.oPanelSettings.sHandleText;

		if( this.oPanelSettings.oStyle.sPanelClass ) { this.ePanel.classList.add(this.oPanelSettings.oStyle.sPanelClass); }
		if( this.oPanelSettings.oStyle.sContentClass ) { this.eContent.classList.add(this.oPanelSettings.oStyle.sContentClass); }
		if( this.oPanelSettings.oStyle.sHandleClass ) { this.eHandle.classList.add(this.oPanelSettings.oStyle.sHandleClass); }

		this.eParent.appendChild(this.ePanel);
	}

	/** -----------------------------------------------------------------------
	 * Apply layout based on current edge direction and required content/handle order.
	 * @private
	 */
	_apply_layout_for_edge() {
		const sEdgeDirection = this._get_edge_direction();

		this.ePanel.innerHTML = '';
		this.ePanel.setAttribute('data-edge-direction', sEdgeDirection);

		if( sEdgeDirection === 'top' ) {
			this.ePanel.appendChild(this.eContent);
			this.ePanel.appendChild(this.eHandle);
		}
		else if( sEdgeDirection === 'bottom' ) {
			this.ePanel.appendChild(this.eHandle);
			this.ePanel.appendChild(this.eContent);
		}
		else if( sEdgeDirection === 'left' ) {
			this.ePanel.appendChild(this.eContent);
			this.ePanel.appendChild(this.eHandle);
		}
		else {
			// right
			this.ePanel.appendChild(this.eHandle);
			this.ePanel.appendChild(this.eContent);
		}

		this._apply_edge_dimensions();
		this._apply_edge_anchor();
	}

	/** -----------------------------------------------------------------------
	 * Apply dimensions per edge and axis.
	 * @private
	 */
	_apply_edge_dimensions() {
		const sEdgeDirection = this._get_edge_direction();
		const iPanelWidth = this._to_valid_size(this.oPanelSettings.iPanelWidth, 320);
		const iPanelHeight = this._to_valid_size(this.oPanelSettings.iPanelHeight, 320);
		const iContentSize = this._to_valid_size(this.oPanelSettings.iContentSize, 180);
		const iHandleSize = this._to_valid_size(this.oPanelSettings.iHandleSize, 42);

		if( sEdgeDirection === 'top' || sEdgeDirection === 'bottom' ) {
			this.ePanel.style.width = `${iPanelWidth}px`;
			this.ePanel.style.height = `${iContentSize + iHandleSize}px`;

			this.eContent.style.width = '100%';
			this.eContent.style.height = `${iContentSize}px`;

			this.eHandle.style.width = '100%';
			this.eHandle.style.height = `${iHandleSize}px`;
		}
		else {
			this.ePanel.style.width = `${iContentSize + iHandleSize}px`;
			this.ePanel.style.height = `${iPanelHeight}px`;

			this.eContent.style.width = `${iContentSize}px`;
			this.eContent.style.height = '100%';

			this.eHandle.style.width = `${iHandleSize}px`;
			this.eHandle.style.height = '100%';
		}
	}

	/** -----------------------------------------------------------------------
	 * Anchor panel to the selected edge with required centering transform.
	 * @private
	 */
	_apply_edge_anchor() {
		const sEdgeDirection = this._get_edge_direction();

		// Reset all edge anchors first.
		this.ePanel.style.top = '';
		this.ePanel.style.right = '';
		this.ePanel.style.bottom = '';
		this.ePanel.style.left = '';

		if( sEdgeDirection === 'top' ) {
			this.ePanel.style.left = '50%';
			this.ePanel.style.transform = 'translateX(-50%)';
		}
		else if( sEdgeDirection === 'bottom' ) {
			this.ePanel.style.left = '50%';
			this.ePanel.style.transform = 'translateX(-50%)';
		}
		else if( sEdgeDirection === 'left' ) {
			this.ePanel.style.top = '50%';
			this.ePanel.style.transform = 'translateY(-50%)';
		}
		else {
			// right
			this.ePanel.style.top = '50%';
			this.ePanel.style.transform = 'translateY(-50%)';
		}
	}

	/** -----------------------------------------------------------------------
	 * Apply base visual styles that use CSS variables so themes can override colors externally.
	 * @private
	 */
	_apply_visual_styles() {
		const sTransitionDuration = this.oPanelSettings.sTransitionDuration || '0.35s';
		const sTransitionTiming = this.oPanelSettings.sTransitionTiming || 'ease-in-out';

      // ## Apply styles to panel ............................................
      let oStyle = this.ePanel.style;
		oStyle.position = 'fixed';
		oStyle.zIndex = String(this.oPanelSettings.iZIndex ?? 1000);
		oStyle.display = 'flex';
		oStyle.flexDirection = this._is_horizontal_edge() ? 'row' : 'column';
		oStyle.transitionDuration = sTransitionDuration;
		oStyle.transitionTimingFunction = sTransitionTiming;
		oStyle.boxShadow = 'var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.2))';
		oStyle.overflow = 'hidden';
		oStyle.background = 'var(--background-body, #ffffff)';

      // ## Apply styles to content and handle elements ......................
      oStyle = this.eContent.style;
		oStyle.boxSizing = 'border-box';
		oStyle.padding = '12px';
		oStyle.background = 'var(--background-body, #ffffff)';
		oStyle.color = 'var(--color-body, #111827)';
		oStyle.overflow = 'auto';

      // ## Apply styles to handle button ....................................
		oStyle = this.eHandle.style;
		oStyle.display = 'flex';
		oStyle.alignItems = 'center';
		oStyle.justifyContent = 'center';
		oStyle.cursor = 'pointer';
		oStyle.border = 'none';
		oStyle.padding = '0';
		oStyle.margin = '0';
		oStyle.userSelect = 'none';
		oStyle.background = 'var(--background-primary, var(--primary, #2563eb))';
		oStyle.color = 'var(--color-primary, #ffffff)';
		oStyle.fontWeight = '600';

		// Rounded corners follow edge direction for a cleaner visual shape.
		if( this._get_edge_direction() === 'top' ) {
			this.ePanel.style.borderRadius = '0 0 var(--radius, 8px) var(--radius, 8px)';
		}
		else if( this._get_edge_direction() === 'bottom' ) {
			this.ePanel.style.borderRadius = 'var(--radius, 8px) var(--radius, 8px) 0 0';
		}
		else if( this._get_edge_direction() === 'left' ) {
			this.ePanel.style.borderRadius = '0 var(--radius, 8px) var(--radius, 8px) 0';
		}
		else {
			this.ePanel.style.borderRadius = 'var(--radius, 8px) 0 0 var(--radius, 8px)';
		}
	}

	/** -----------------------------------------------------------------------
	 * Apply open/closed offset for the active edge.
	 * @private
	 */
	_apply_state_position() {
		const sEdgeDirection = this._get_edge_direction();
		const iContentSize = this._to_valid_size(this.oPanelSettings.iContentSize, 180);
		const sClosedOffset = `-${iContentSize}px`;

		this.eHandle.setAttribute('aria-expanded', this.bIsOpen ? 'true' : 'false');
		this.ePanel.setAttribute('data-open', this.bIsOpen ? '1' : '0');

		if( sEdgeDirection === 'top' ) {
			this.ePanel.style.transitionProperty = 'top';
			this.ePanel.style.top = this.bIsOpen ? '0px' : sClosedOffset;
		}
		else if( sEdgeDirection === 'bottom' ) {
			this.ePanel.style.transitionProperty = 'bottom';
			this.ePanel.style.bottom = this.bIsOpen ? '0px' : sClosedOffset;
		}
		else if( sEdgeDirection === 'left' ) {
			this.ePanel.style.transitionProperty = 'left';
			this.ePanel.style.left = this.bIsOpen ? '0px' : sClosedOffset;
		}
		else {
			this.ePanel.style.transitionProperty = 'right';
			this.ePanel.style.right = this.bIsOpen ? '0px' : sClosedOffset;
		}
	}

	/** -----------------------------------------------------------------------
	 * Handle document clicks for optional outside-click close behavior.
	 * @param {MouseEvent} eEvent_
	 * @private
	 */
	_on_document_click(eEvent_) {
		if( !this.oPanelSettings.bCloseOnOutsideClick ) { return; }
		if( !this.bIsOpen ) { return; }

		if( !this.ePanel.contains(eEvent_.target) ) { this.Close(); }
	}

	/** -----------------------------------------------------------------------
	 * Attach event listeners.
	 * @private
	 */
	_bind_events() {
      this.eHandle.addEventListener('click', this.oBoundHandlers.fnOnHandleClick);
    
      if(this.oPanelSettings.bCloseOnOutsideClick) { document.addEventListener('click', this.oBoundHandlers.fnOnDocumentClick, true); } // capture phase
	}

	/** -----------------------------------------------------------------------
	 * Remove event listeners.
	 * @private
	 */
	_unbind_events() {
      if(this.eHandle) { this.eHandle.removeEventListener('click', this.oBoundHandlers.fnOnHandleClick);}

      // Safe to call even if listener was never added
      document.removeEventListener('click', this.oBoundHandlers.fnOnDocumentClick, true);
   }

	/** -----------------------------------------------------------------------
	 * Emit toggle callback when state changes.
	 * @private
	 */
	_emit_toggle() {
		if( typeof this.oPanelSettings.fnOnToggle === 'function' ) {
			this.oPanelSettings.fnOnToggle(this.bIsOpen, this);
		}
	}

	/** -----------------------------------------------------------------------
	 * Normalize and validate edge direction.
	 * @returns {string}
	 * @private
	 */
	_get_edge_direction() {
		const sEdgeDirection = String(this.oPanelSettings.sEdgeDirection || 'top').toLowerCase();
		if( ['top', 'bottom', 'left', 'right'].includes(sEdgeDirection) ) { return sEdgeDirection; }
		return 'top';
	}

	/** -----------------------------------------------------------------------
	 * Returns true for left/right edge.
	 * @returns {boolean}
	 * @private
	 */
	_is_horizontal_edge() {
		const sEdgeDirection = this._get_edge_direction();
		return sEdgeDirection === 'left' || sEdgeDirection === 'right';
	}

	/** -----------------------------------------------------------------------
	 * Convert value to a positive integer size.
	 * @param {number|string} vSize_ - Size value.
	 * @param {number} iFallback - Fallback size.
	 * @returns {number}
	 * @private
	 */
	_to_valid_size(vSize_, iFallback) {
		const iParsed = Number.parseInt(vSize_, 10);
		if( Number.isFinite(iParsed) && iParsed > 0 ) { return iParsed; }
		return iFallback;
	}
}

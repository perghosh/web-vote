// @FILE [tag: toast] [description: Object to produce toast messages, its animated messages to inform user about something] [name: gd_ui_toast.js]

/**
 * Class to create and manage toast notification messages.
 *
 * Toast messages are animated notifications that appear on screen to inform users
 * about events, errors, or status updates. They support various positions, types,
 * stacking, auto-dismissal with progress bars, and manual close functionality.
 *
 * **Quick Start:**
 * ```javascript
 * // Create toast manager
 * const toast = new UIToast(document.body, {
 *    sPosition: 'top-right',
 *    iDuration: 3000
 * });
 *
 * // Show simple toast
 * toast.Show('Operation successful!');
 *
 * // Show styled toast with options
 * toast.Show('Error occurred', {
 *    sType: 'danger',
 *    iDuration: 5000,
 *    bShowClose: true
 * });
 * ```
 *
 * **Key Concepts:**
 * - **Position**: Toasts can appear in any corner or centered at top/bottom
 * - **Type**: Uses CSS variables for different semantic styles (success, danger, warning, etc.)
 * - **Stacking**: Multiple toasts stack vertically with smooth animations
 * - **Progress Bar**: Shows remaining time before auto-dismissal
 * - **Manual Close**: Optional close button for immediate dismissal
 *
 * **Supported Positions:**
 * - 'top-left', 'top-center', 'top-right' (default)
 * - 'bottom-left', 'bottom-center', 'bottom-right'
 *
 * **Supported Types:**
 * - 'primary' (default), 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'
 *
 * @param {HTMLElement|string} parent_ - The parent container element or selector.
 * @param {Object} [options_={}] - Configuration options.
 * @param {string} [options_.sPosition='top-right'] - Position of toast container.
 * @param {number} [options_.iDuration=3000] - Default display duration in milliseconds.
 * @param {number} [options_.iMaxStack=5] - Maximum number of toasts to show at once.
 * @param {boolean} [options_.bShowProgress=true] - Whether to show progress bars by default.
 * @param {boolean} [options_.bShowClose=true] - Whether to show close buttons by default.
 * @param {Object} [options_.oStyle] - CSS class names for custom styling.
 * @param {string} [options_.oStyle.container] - Class for toast container.
 * @param {string} [options_.oStyle.toast] - Class for individual toast elements.
 * @param {string} [options_.oStyle.content] - Class for toast content area.
 * @param {string} [options_.oStyle.close] - Class for close button.
 * @param {string} [options_.oStyle.progress] - Class for progress bar container.
 * @param {string} [options_.oStyle.progressBar] - Class for progress bar element.
 */
class UIToast {

   constructor(parent_, oOptions_ = {}) {
      let eParent;
      if( typeof parent_ === "string" ) {
         eParent = document.querySelector(parent_);
         if( !eParent ) eParent = document.getElementById(parent_);
      }
      else {
         eParent = parent_;
      }

      if( !eParent ) { throw new Error('UIToast: Parent not found'); }

      // Store parent element
      this.eParent = eParent;

      // Apply options with defaults
      this.oOptions = Object.assign({
         sPosition: 'top-right',
         iDuration: 3000,
         iMaxStack: 5,
         bShowProgress: true,
         bShowClose: true,
         oStyle: {
            container: null,
            toast: null,
            content: null,
            close: null,
            progress: null,
            progressBar: null
         }
      }, oOptions_);

      this.oStyle = this.oOptions.oStyle;

      // Store active toasts
      this.aToasts = [];

      // Create container element
      this.eContainer = document.createElement('div');
      this.eContainer.setAttribute('data-toast-container', '');

      // Apply position-based classes
      this._apply_position_styles();

      // Apply user-defined container class
      if( this.oStyle.container ) {
         this.eContainer.classList.add(this.oStyle.container);
      }

      // Append container to parent
      this.eParent.appendChild(this.eContainer);
   }

   /** -----------------------------------------------------------------------
    * Show a toast message.
    * @param {string} sMessage - The message content (can be HTML).
    * @param {Object} [oOptions_={}] - Options for this specific toast.
    * @param {string} [oOptions_.sType='primary'] - Toast type.
    * @param {number} [oOptions_.iDuration] - Override default duration.
    * @param {boolean} [oOptions_.bShowProgress] - Override default progress bar visibility.
    * @param {boolean} [oOptions_.bShowClose] - Override default close button visibility.
    * @param {Function} [oOptions_.fnOnClose] - Callback when toast is closed.
    * @param {string} [oOptions_.minWidth='250px'] - Minimum width of the toast.
    * @returns {HTMLElement} The toast element.
    */
   Show(sMessage, oOptions_ = {}) {
      // ## Configure defaults ...............................................
      const oToastOptions = Object.assign({
         sType: 'primary',
         iDuration: this.oOptions.iDuration,
         bShowProgress: this.oOptions.bShowProgress,
         bShowClose: this.oOptions.bShowClose,
         fnOnClose: null
      }, oOptions_);

      // ## Check if we've exceeded max stack ................................
      if( this.aToasts.length >= this.oOptions.iMaxStack ) {
         // Remove oldest toast
         const eOldestToast = this.aToasts.shift();
         this._dismiss_toast(eOldestToast, false);
      }

      // Create toast element
      const eToast = this._create_toast_element(sMessage, oToastOptions);

      // Add to DOM
      this.eContainer.appendChild(eToast);
      this.aToasts.push(eToast);

      // Trigger entry animation
      requestAnimationFrame(() => {
         eToast.style.opacity = '1';
         eToast.style.transform = 'translateY(0)';
      });

      // Store callbacks and timeout
      eToast._onClose = oToastOptions.fnOnClose;

      // Start progress bar animation and auto-dismiss
      if( oToastOptions.iDuration > 0 && oToastOptions.bShowProgress && eToast._progressBar ) {
         // Animate progress bar
         // Need TWO animation frames to ensure browser sees initial state first
         requestAnimationFrame(() => {
            eToast._progressBar.style.transition = `width ${oToastOptions.iDuration}ms linear`;
            requestAnimationFrame(() => { eToast._progressBar.style.width = '0%'; });
         });

         // Set auto-dismiss timeout
         eToast._timeout = setTimeout(() => {
            this._dismiss_toast(eToast, true);
         }, oToastOptions.iDuration);
      }
      else if( oToastOptions.iDuration > 0 ) {
         // Auto-dismiss without progress bar
         eToast._timeout = setTimeout(() => { this._dismiss_toast(eToast, true); }, oToastOptions.iDuration);
      }

      return eToast;
   }

   /** -----------------------------------------------------------------------
    * Show a success toast (shorthand for Show with type='success').
    * @param {string} sMessage - The message content.
    * @param {Object} [oOptions_={}] - Additional toast options.
    * @returns {HTMLElement} The toast element.
    */
   Success(sMessage, oOptions_ = {}) { return this.Show(sMessage, Object.assign({ sType: 'success' }, oOptions_)); }

   /** -----------------------------------------------------------------------
    * Show an error/danger toast (shorthand for Show with type='danger').
    * @param {string} sMessage - The message content.
    * @param {Object} [oOptions_={}] - Additional toast options.
    * @returns {HTMLElement} The toast element.
    */
   Error(sMessage, oOptions_ = {}) { return this.Show(sMessage, Object.assign({ sType: 'danger' }, oOptions_)); }

   /** -----------------------------------------------------------------------
    * Show a warning toast (shorthand for Show with type='warning').
    * @param {string} sMessage - The message content.
    * @param {Object} [oOptions_={}] - Additional toast options.
    * @returns {HTMLElement} The toast element.
    */
   Warning(sMessage, oOptions_ = {}) { return this.Show(sMessage, Object.assign({ sType: 'warning' }, oOptions_)); }

   /** -----------------------------------------------------------------------
    * Show an info toast (shorthand for Show with type='info').
    * @param {string} sMessage - The message content.
    * @param {Object} [oOptions_={}] - Additional toast options.
    * @returns {HTMLElement} The toast element.
    */
   Info(sMessage, oOptions_ = {}) { return this.Show(sMessage, Object.assign({ sType: 'info' }, oOptions_)); }

   /** -----------------------------------------------------------------------
    * Show an info toast (shorthand for Show with type='info').
    * @param {string} sMessage - The message content.
    * @param {Object} [oOptions_={}] - Additional toast options.
    * @returns {HTMLElement} The toast element.
    */
   Info(sMessage, oOptions_ = {}) { return this.Show(sMessage, Object.assign({ sType: 'info' }, oOptions_)); }

   /** -----------------------------------------------------------------------
    * Dismiss all active toasts immediately.
    * @param {boolean} bAnimated - Whether to animate the dismissal (default: true).
    */
   DismissAll(bAnimated = true) {
      // Copy array to avoid issues while iterating
      const aToastsCopy = [...this.aToasts];

      aToastsCopy.forEach(eToast => {
         if( bAnimated ) {
            this._dismiss_toast(eToast, false);
         }
         else {
            // Immediate dismissal without animation
            if( eToast._timeout ) {
               clearTimeout(eToast._timeout);
            }

            if( eToast.parentNode ) {
               eToast.parentNode.removeChild(eToast);
            }

            if( eToast._onClose && typeof eToast._onClose === 'function' ) {
               eToast._onClose(false);
            }
         }
      });

      // Clear array
      this.aToasts = [];
   }

   /** -----------------------------------------------------------------------
    * Update the default options for new toasts.
    * @param {Object} oOptions_ - New default options to apply.
    */
   UpdateOptions(oOptions_) {
      Object.assign(this.oOptions, oOptions_);

      // Re-apply position styles if position changed
      if( oOptions_.sPosition ) {
         this._apply_position_styles();
      }
   }

   /** -----------------------------------------------------------------------
    * Get the number of currently active toasts.
    * @returns {number} Number of active toasts.
    */
   GetActiveCount() { return this.aToasts.length; }

   /** -----------------------------------------------------------------------
    * Destroy the toast manager and clean up all toasts.
    */
   Destroy() {
      // Clear all timeouts and remove toasts
      this.DismissAll(false);

      // Remove container from DOM
      if( this.eContainer && this.eContainer.parentNode ) {
         this.eContainer.parentNode.removeChild(this.eContainer);
      }

      // Clear references
      this.aToasts = [];
      this.eContainer = null;
      this.eParent = null;
   }

   /** -----------------------------------------------------------------------
    * Apply position-based styles to container based on position option.
    * @private
    */
   _apply_position_styles() {
      const sPosition = this.oOptions.sPosition;

      // Position classes for container
      this.eContainer.style.position = 'fixed';
      this.eContainer.style.zIndex = '9999';
      this.eContainer.style.display = 'flex';
      this.eContainer.style.flexDirection = 'column';
      this.eContainer.style.gap = '10px';
      this.eContainer.style.maxWidth = '400px';
      this.eContainer.style.pointerEvents = 'none'; // Allow clicks through container

      // Position based on option
      switch( sPosition ) {
         case 'top-left':
            this.eContainer.style.top = '20px';
            this.eContainer.style.left = '20px';
            this.eContainer.style.alignItems = 'flex-start';
            break;
         case 'top-center':
            this.eContainer.style.top = '20px';
            this.eContainer.style.left = '50%';
            this.eContainer.style.transform = 'translateX(-50%)';
            this.eContainer.style.alignItems = 'center';
            break;
         case 'top-right':
            this.eContainer.style.top = '20px';
            this.eContainer.style.right = '20px';
            this.eContainer.style.alignItems = 'flex-end';
            break;
         case 'bottom-left':
            this.eContainer.style.bottom = '20px';
            this.eContainer.style.left = '20px';
            this.eContainer.style.alignItems = 'flex-start';
            break;
         case 'bottom-center':
            this.eContainer.style.bottom = '20px';
            this.eContainer.style.left = '50%';
            this.eContainer.style.transform = 'translateX(-50%)';
            this.eContainer.style.alignItems = 'center';
            break;
         case 'bottom-right':
            this.eContainer.style.bottom = '20px';
            this.eContainer.style.right = '20px';
            this.eContainer.style.alignItems = 'flex-end';
            break;
         default:
            // Default to top-right
            this.eContainer.style.top = '20px';
            this.eContainer.style.right = '20px';
            this.eContainer.style.alignItems = 'flex-end';
      }
   }

   /** -----------------------------------------------------------------------
    * Get CSS variable value for a specific toast type.
    * @param {string} sType - The toast type (e.g., 'success', 'danger').
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

   /** -----------------------------------------------------------------------
    * Create a toast element with content, close button, and progress bar.
    *
    * This method creates a toast element with the specified message and options.
    * It applies the appropriate styles and event listeners to the toast.
    *
    * @param {string} sMessage - The message content (can be HTML).
    * @param {Object} oToastOptions - Options specific to this toast.
    * @returns {HTMLElement} The toast element.
    * @private
    */
   _create_toast_element(sMessage, oToastOptions) {
      const eToast = document.createElement('div');
      eToast.setAttribute('data-toast', '');

      // Apply user-defined toast class
      if( this.oStyle.toast ) {
         eToast.classList.add(this.oStyle.toast);
      }

      // Get type-specific colors
      const sType = oToastOptions.sType || 'primary';
      const sBackground = this._get_type_style(sType, 'background');
      const sColor = this._get_type_style(sType, 'color');
      const sBackgroundHover = this._get_type_style(sType, 'background-hover');

      // ## Apply base styles .................................................
      eToast.style.pointerEvents = 'auto';
      eToast.style.position = 'relative';
      eToast.style.minWidth = oToastOptions.minWidth || '250px';
      eToast.style.maxWidth = '100%';
      eToast.style.padding = '12px 16px';
      eToast.style.backgroundColor = sBackground;
      eToast.style.color = sColor;
      eToast.style.borderRadius = '4px';
      eToast.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      eToast.style.transition = 'opacity 0.3s ease, transform 0.3s ease, margin 0.3s ease';
      eToast.style.opacity = '0';
      eToast.style.transform = this._get_entry_transform();

      // ### Add hover effect .................................................
      eToast.addEventListener('mouseenter', () => {
         if( !eToast.classList.contains('toast-closing') ) { eToast.style.backgroundColor = sBackgroundHover; }
      });

      eToast.addEventListener('mouseleave', () => {
         if( !eToast.classList.contains('toast-closing') ) { eToast.style.backgroundColor = sBackground; }
      });

      // ## Create content wrapper ............................................
      const eContent = document.createElement('div');
      eContent.innerHTML = sMessage;

      if( this.oStyle.content ) { eContent.classList.add(this.oStyle.content); }
      eContent.style.flex = '1';
      eContent.style.marginRight = oToastOptions.bShowClose ? '24px' : '0';

      eToast.appendChild(eContent);

      // ### Add close button if enabled ......................................
      if( oToastOptions.bShowClose ) {
         const eClose = document.createElement('button');
         eClose.innerHTML = '&times;';
         eClose.setAttribute('type', 'button');
         eClose.setAttribute('aria-label', 'Close');

         if (this.oStyle.close) { eClose.classList.add(this.oStyle.close); }

         // #### Close button styles .........................................
         Object.assign(eClose.style, {alignItems:'center',background:'none',border:'none',color:'inherit',cursor:'pointer',display:'flex',fontSize:'20px',height:'20px',justifyContent:'center',lineHeight:'1',opacity:'0.7',padding:'0',position:'absolute',right:'8px',top:'8px',width:'20px'});

/*
         eClose.style.position = 'absolute';
         eClose.style.top = '8px';
         eClose.style.right = '8px';
         eClose.style.background = 'none';
         eClose.style.border = 'none';
         eClose.style.color = 'inherit';
         eClose.style.fontSize = '20px';
         eClose.style.lineHeight = '1';
         eClose.style.cursor = 'pointer';
         eClose.style.padding = '0';
         eClose.style.width = '20px';
         eClose.style.height = '20px';
         eClose.style.display = 'flex';
         eClose.style.alignItems = 'center';
         eClose.style.justifyContent = 'center';
         eClose.style.opacity = '0.7';
         */

         eClose.addEventListener('mouseenter', () => { eClose.style.opacity = '1'; });

         eClose.addEventListener('mouseleave', () => { eClose.style.opacity = '0.7'; });

         // Store close handler for cleanup
         const closeHandler = () => { this._dismiss_toast(eToast, false); };
         eClose.addEventListener('click', closeHandler);
         eToast._closeHandler = closeHandler;

         eToast.appendChild(eClose);
      }

      // ## Add progress bar if enabled .......................................
      if( oToastOptions.bShowProgress && oToastOptions.iDuration > 0 ) {
         const eProgress = document.createElement('div');

         if( this.oStyle.progress ) {
            eProgress.classList.add(this.oStyle.progress);
         }

         // ### Progress bar container styles .................................
         eProgress.style.position = 'absolute';
         eProgress.style.bottom = '0';
         eProgress.style.left = '0';
         eProgress.style.right = '0';
         eProgress.style.height = '3px';
         eProgress.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
         eProgress.style.overflow = 'hidden';

         const eProgressBar = document.createElement('div');

         if( this.oStyle.progressBar ) {
            eProgressBar.classList.add(this.oStyle.progressBar);
         }

         // ### Progress bar styles ...........................................
         eProgressBar.style.height = '100%';
         eProgressBar.style.width = '100%';
         eProgressBar.style.transition = 'none';
         eProgressBar.style.backgroundColor = 'currentColor';

         eProgress.appendChild(eProgressBar);
         eToast.appendChild(eProgress);

         // Store progress bar reference
         eToast._progressBar = eProgressBar;
      }

      return eToast;
   }

   /** -----------------------------------------------------------------------
    * Get the initial transform value for entry animation based on position.
    * @returns {string} CSS transform value.
    * @private
    */
   _get_entry_transform() {
      const sPosition = this.oOptions.sPosition;

      if( sPosition.includes('top') ) {
         return 'translateY(-20px)';
      }
      else if( sPosition.includes('bottom') ) {
         return 'translateY(20px)';
      }
      return 'translateY(-20px)';
   }

   /** -----------------------------------------------------------------------
    * Get the exit transform value based on position.
    * @returns {string} CSS transform value.
    * @private
    */
   _get_exit_transform() {
      const sPosition = this.oOptions.sPosition;

      if( sPosition.includes('top') ) {
         return 'translateY(-20px)';
      }
      else if( sPosition.includes('bottom') ) {
         return 'translateY(20px)';
      }
      return 'translateY(-20px)';
   }


   /** -----------------------------------------------------------------------
    * Dismiss a toast with exit animation.
    * @param {HTMLElement} eToast - The toast element to dismiss.
    * @param {boolean} bAuto - Whether this is an auto-dismiss or manual.
    * @private
    */
   _dismiss_toast(eToast, bAuto) {
      if( !eToast || eToast.classList.contains('toast-closing') ) {
         return;
      }

      if( eToast._closeHandler ) {
         const eClose = eToast.querySelector('button[aria-label="Close"]');
         if( eClose ) eClose.removeEventListener('click', eToast._closeHandler);
      }

      if( eToast._timeout ) { clearTimeout(eToast._timeout); }                // Clear any pending timeout

      eToast.classList.add('toast-closing');                                  // Mark as closing to prevent duplicate dismissals

      // ## Remove from active toasts array ..................................
      const iIndex = this.aToasts.indexOf(eToast);
      if( iIndex > -1 ) { this.aToasts.splice(iIndex, 1); }

      // Trigger exit animation
      eToast.style.opacity = '0';
      eToast.style.transform = this._get_exit_transform();
      eToast.style.marginTop = eToast.offsetHeight + 'px'; // Make room for stacking animation

      // ## Remove from DOM after animation completes .........................
      setTimeout(() => {
         if( eToast.parentNode ) { eToast.parentNode.removeChild(eToast); }

         // Call close callback if provided
         if( eToast._onClose && typeof eToast._onClose === 'function' ) { eToast._onClose(bAuto); }
      }, 300); // Match transition duration
   }

}

var gd = gd || {};

(function(oNS) {

// Static URL that will be used if sUrl argument is empty
oNS.sUrl_s = ""; // Set your default URL here   

// Static base URL that will be used if sBaseUrl argument is empty
oNS.sDefaultBaseUrl_s = ""; // Set your default base URL here

/** ---------------------------------------------------------------------------
 * Set the URL for SendToServer
 * @param {string} sUrl - The base URL to use as default
 */
oNS.SetUrl = function(sUrl) { oNS.sUrl_s = sUrl; };


/** ---------------------------------------------------------------------------
 * Set the default base URL for SendToServer
 * @param {string} sBaseUrl - The base URL to use as default
 */
oNS.SetBaseUrl = function(sBaseUrl) { oNS.sDefaultBaseUrl_s = sBaseUrl; };


/** ---------------------------------------------------------------------------
 * Get base URL with directory path (recommended for most cases)
 * Example: https://www.site.com/extra1/test.html  →  https://www.site.com/extra1/
 * @returns {string}
 */
oNS.GetUrl = function() {
   const { protocol, hostname, port, pathname } = window.location;

   let sUrl = `${protocol}//${hostname}`;

   if(port && port !== "80" && port !== "443" && port !== "") { sUrl += `:${port}`; }

   // Remove filename if it exists and keep only directory path
   const sDirPath = pathname.substring(0, pathname.lastIndexOf('/') + 1) || '/';
    
   sUrl += sDirPath;

   return sUrl;
}



/** ---------------------------------------------------------------------------
 * Get origin only (domain + protocol)
 * Example: https://www.site.com/extra1/test.html  →  https://www.site.com
 * @returns {string}
 */
oNS.GetBaseUrl = function() {
   // Extract protocol, hostname, and port from current page
   const { protocol, hostname, port } = window.location;

   // Build base URL
   let sBaseUrl = `${protocol}//${hostname}`;

   // Add port if it's not default (80 for http, 443 for https)
   if(port && port !== "80" && port !== "443" && port !== "") { sBaseUrl += `:${port}`; }

   return sBaseUrl;
}


/** ---------------------------------------------------------------------------
 * Encodes URL parameters by iterating over all search parameters and
 * automatically encoding their values.
 *
 * @param {string} sUrl - The URL string to encode.
 * @returns {string} The fully encoded URL string.
 */
oNS.NormalizeUrl = function(sUrl) {
   try {
      // ## 1. Parse the string into a URL object
      // Note: If your input doesn't have a protocol (e.g. starts with "localhost"),
      // new URL() might fail. You can prefix it with http:// temporarily if needed.
      let oUrlObject;
      if(sUrl.startsWith('http')) {
         oUrlObject = new URL(sUrl);
      }
      else {
         // Handle inputs missing protocol (e.g. localhost:8000...)
         oUrlObject = new URL('http://' + sUrl);
      }

      // ## 2. Return the fully encoded URL string
      // If we added a fake protocol earlier, remove it for the output
      let sFinalUrl = oUrlObject.toString();
      if(!sUrl.startsWith('http')) {
         sFinalUrl = sFinalUrl.replace('http://', '');
      }

      return sFinalUrl;
   }
   catch (e_) {
      console.error("Error encoding URL:", e_);
      alert("Could not parse the URL. Ensure it looks like a valid web address.");
      return sUrl; // Return original on error
   }
}

/** ---------------------------------------------------------------------------
 * Converts a string to base64 format.
 *
 * @param {string} sText - The string to convert to base64.
 * @returns {string} The base64 encoded string.
 */
oNS.EncodeToBase64 = function(sText) {
   try {
      // ## Handle Unicode strings properly by encoding to UTF-8 first
      return btoa(encodeURIComponent(sText).replace(/%([0-9A-F]{2})/g,
         function toSolidBytes(match, p1) { return String.fromCharCode(parseInt(p1, 16)); }
      ));
   }
   catch (e_) {
      console.error("Error converting to base64:", e_);
      return sText; // Return original on error
   }
}

/** -------------------------------------------------------------------------
 * Simple method to wrap sending requests to the server
 * 
 * If arguments_ is an object, it will be treated as query parameters. Values will be URL-encoded and appended to the endpoint as query string.
 * If arguments_ is a string, it will be treated as newline-separated key=value pairs and processed similarly to the object case.
 *
 * @param {string}                  sEndpoint   - Endpoint path (e.g. "!db/select?ui=1&")
 * @param {string|object|Document} [arguments_] - If object → treated as QUERY PARAMETERS
 *                                                If string  → old newline format
 * @param {string|object|Document} [body_]      - Optional body (JSON, XML or string)
 * @returns {Promise<{format: "json"|"xml"|"text", data: any, status: number}>}
 */
oNS.Send = function(sEndpoint, arguments_, body_) {
   if(typeof arguments_ === "string") { return oNS.SendToServer("", sEndpoint, arguments_, body_); }
   else if(typeof arguments_ === "object" && arguments_ !== null) {
      let sArguments = "";
      for(let sKey in arguments_) {
         if(arguments_.hasOwnProperty(sKey)) {
            if(sArguments) sArguments += "&";
            sArguments += sKey + "=" + encodeURIComponent(arguments_[sKey]);
         }
      }

      if(sArguments) {
         if(sEndpoint.indexOf('?') === -1) { sEndpoint += '?'; }
         else if(sEndpoint.slice(-1) !== '&' && sEndpoint.slice(-1) !== '?') { sEndpoint += '&'; }
         sEndpoint += sArguments;
      }

      return oNS.SendToServer("", sEndpoint, undefined, body_); // ← pass undefined not sArguments
   }

   return oNS.SendToServer("", sEndpoint, arguments_, body_); // fallback to original behavior if arguments_ is not an object or string
};

/** -------------------------------------------------------------------------
 * Send arguments to server and return a typed response object.
 *
 * @param {string}                  sBaseUrl    - Base URL of the server, falls back to gd.sDefaultBaseUrl_s
 * @param {string}                  sEndpoint   - Endpoint path appended to the base URL
 * @param {string|object|Document} [arguments_] - Optional arguments. String: newline-separated key=value
 *                                                pairs added as query params. Object: serialised to JSON body.
 *                                                Document: serialised to XML body.
 * @param {string|object|Document} [body_]      - Optional explicit body, takes precedence over arguments_ body
 * @returns {Promise<{format: "json"|"xml"|"text", data: any, status: number}>} Response object containing format, data, and status
 */
oNS.SendToServer = function(sBaseUrl, sEndpoint, arguments_, body_) {
   
   let sBody;
   let sContentType = 'application/xml; charset=utf-8'; // Default content type

   // ## If arguments_ is XML Document → treat as body. Otherwise respect original intent.
   if(arguments_ instanceof Document) {
      body_ = arguments_;
      arguments_ = "";
   }
   else if(typeof arguments_ === "object" && arguments_ !== null && body_ === undefined) {
      body_ = arguments_;                                                     // object becomes body (JSON) when no explicit body_ is passed
      arguments_ = "";
   }

   const sArguments = typeof arguments_ === "string" ? arguments_ : "";       // Ensure arguments is a string, default to empty if undefined

   // ## Build body content ..................................................
   if(body_ !== undefined) {
      if(body_ instanceof Document) {
         sBody = new XMLSerializer().serializeToString(body_);
         sContentType = 'application/xml; charset=utf-8';
      }
      else if(typeof body_ === "object") {
         sBody = JSON.stringify(body_);
         sContentType = 'application/json; charset=utf-8';
      }
      else if(typeof body_ === "string") { sBody = body_; }
   }

   // Use static base URL if sBaseUrl is empty or undefined
   if(!sBaseUrl) { 
      if( gd.sUrl_s ) { sBaseUrl = gd.sUrl_s; }
      else { sBaseUrl = gd.sDefaultBaseUrl_s; }
   }

   if(!sBaseUrl.endsWith('/') && !sBaseUrl.endsWith("?") ) { sBaseUrl += '/'; }
   let sFullUrl = sBaseUrl;

   if(sEndpoint) {
      const sCleanEndpoint = sEndpoint.startsWith('/') ? sEndpoint.substring(1) : sEndpoint;
      sFullUrl += sCleanEndpoint;
   }   

   let sEncodedArguments = ""; // Initialize encoded arguments string
   if(sArguments) { sEncodedArguments = oNS._BuildQueryFromLegacyString(sArguments);}

   // ## Append query string to URL if arguments exist .......................
   if(sEncodedArguments.length > 0) {
      if(sFullUrl.indexOf('=') !== -1) {
         if(sFullUrl.charAt(sFullUrl.length - 1) !== "&") { sFullUrl += "&"; }
      }
      else {
         if(sFullUrl.charAt(sFullUrl.length - 1) !== "?") { sFullUrl += "?"; }
      }
      sFullUrl += sEncodedArguments;
   }


   // ## Build fetch options ...........................................

   const oOptions = {
      method:  sBody ? 'POST' : 'GET',
      headers: { 'Content-Type': sContentType }
   };
   if( sBody ) { oOptions.body = sBody; }

   // ## Send the request and pick up the response as { format: <format>, data: <data>, status: <status> }

   return fetch(sFullUrl, oOptions)
   .then(async response => {
      if(!response.ok) {
         const sErrorMessage = await response.clone().text();
         throw new Error(`HTTP error! status: ${response.status}, message: ${sErrorMessage}`);
      }

      const sContentType = response.headers.get('content-type');

      if(sContentType && sContentType.includes('application/json')) {
          return response.json().then(data => ({ format: 'json', data, status: response.status }));
      }
      else if(sContentType && (sContentType.includes('application/xml') || sContentType.includes('text/xml'))) {
         return response.text().then(text => {
            const oDOMParser = new DOMParser();
            const xml_ = oDOMParser.parseFromString(text, "text/xml");
            return { format: 'xml', data: xml_, status: response.status };
         });
      }
      else {
         return response.text().then(data => ({ format: 'text', data, status: response.status }));
      }
   })
   .catch(error => {
      const sError = "Error sending request:" + error.message;
      console.error(sError);
      throw error;
   });   
}

/* =====================================================================
   Helper Functions
===================================================================== */

// Modern method to build query string from an object, with proper encoding and filtering of undefined/null values
oNS._BuildQueryString = function(o_) {
   if (!o_ || typeof o_ !== "object") return "";
   return Object.keys(o_)
      .filter(sKey => o_[sKey] !== undefined && o_[sKey] !== null)
      .map(sKey => `${encodeURIComponent(sKey)}=${encodeURIComponent(o_[sKey])}`)
      .join('&');
};

// Legacy method to build query string from newline-separated key=value pairs
oNS._BuildQueryFromLegacyString = function(s_) {
   if (!s_ || typeof s_ !== "string") return "";

   return s_.split('\n')
         .map(sLine => sLine.trim())
         .filter(sLine => sLine && sLine.includes('='))
         .map(sLine => {
            const iIndex = sLine.indexOf('=');
            const sKey = sLine.substring(0, iIndex).trim();
            const sValue = sLine.substring(iIndex + 1).trim();
            return `${encodeURIComponent(sKey)}=${encodeURIComponent(sValue)}`;
         })
         .join('&');
};

})(gd);

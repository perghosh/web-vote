var gd = gd || {};

(function(oNS) {

// Static base URL that will be used if sBaseUrl argument is empty
oNS.sDefaultBaseUrl_s = ""; // Set your default base URL here

/** ---------------------------------------------------------------------------
 * Set the default base URL for SendToServer
 * @param {string} sBaseUrl - The base URL to use as default
 */
oNS.SetBaseUrl = function(sBaseUrl) { oNS.sDefaultBaseUrl_s = sBaseUrl; };


/** ---------------------------------------------------------------------------
 * Get the default base URL for SendToServer
 * @returns {string} The default base URL
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
oNS.EncodeUrlParams = function(sUrl) {
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
 * @returns {Promise<{type: "json"|"xml"|"text", data: any}>}
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
 * @returns {Promise<{type: "json"|"xml"|"text", data: any}>}
 */
oNS.SendToServer = function(sBaseUrl, sEndpoint, arguments_, body_) {
   
   let sBody;
   let sContentType = 'application/xml; charset=utf-8'; // Default content type
   
   if( typeof arguments_ === "object" ) { body_ = arguments_; arguments_ = ""; } // no string that this should be some sort of body
   
   const sArguments = typeof arguments_ === "string" ? arguments_ : ""; // Ensure arguments is a string, default to empty if undefined

   // ## Set body as text, if body_ is xml document or json then convert to string based on these types
   if( body_ !== undefined ) {
      if(typeof body_ === "object" && !(body_ instanceof Document)) {
         // Convert object to json as sBody
         sBody = JSON.stringify(body_);
         sContentType = 'application/json; charset=utf-8';                     // Set content type to JSON when sending an object
      }
      else if(body_ instanceof Document) { sBody = new XMLSerializer().serializeToString(body_);}
      else if(typeof body_ === "string") { sBody = body_;}
   }

   // Use static base URL if sBaseUrl is empty or undefined
   if(!sBaseUrl) { sBaseUrl = gd.sDefaultBaseUrl_s; }


   if(!sBaseUrl.endsWith('/') && !sBaseUrl.endsWith("?") ) { sBaseUrl += '/'; } // Ensure base URL ends with slash for proper endpoint concatenation
   let sFullUrl = sBaseUrl; // start building full URL with base URL

   if( sEndpoint ) {
      const sCleanEndpoint = sEndpoint.startsWith('/') ? sEndpoint.substring(1) : sEndpoint; // Remove leading slash from endpoint if present (to avoid double slashes)
      sFullUrl += sCleanEndpoint;                                             // Build the complete URL
   }

   let sEncodedArguments = "";
   if(sArguments) {
         // ## Split arguments by newline character and then find first '=' to split there
         const aArguments = sArguments.split('\n');

      for(let sArgument of aArguments) {                                      // Iterate aArguments
         const iEqualPosition = sArgument.indexOf('=');
         if(iEqualPosition !== -1) {
            if( sEncodedArguments ) sEncodedArguments += '&';
            const sKey = sArgument.substring(0, iEqualPosition).trim();
            const sValue = sArgument.substring(iEqualPosition + 1).trim();
            sEncodedArguments += sKey + '=' + encodeURIComponent(sValue);
         }
         else {
            const sError = 'Invalid argument format: ' + sArgument;                                console.log(sError);
            throw new Error(sError);
         }
      }
   }
   else if(typeof arguments_ === "object" && !(arguments_ instanceof Document)) {
      // Convert object to json as sBody
      sBody = JSON.stringify(arguments_);
      sContentType = 'application/json; charset=utf-8';                                      // Set content type to JSON when sending an object
   }
   else if(arguments_ instanceof Document) {
      // Handle XML document arguments
      sBody = new XMLSerializer().serializeToString(arguments_);
   }

   // ## If encoded arguments exist and URL contains '='
   if( sEncodedArguments.length > 0 && sFullUrl.indexOf('=') !== -1 ) {
      if(sFullUrl.charAt(sFullUrl.length - 1) !== "&") { sFullUrl += "&"; }    // If sFullUrl does not have a trailing '&' then add it
      sFullUrl += sEncodedArguments;
   }
   else if( sEncodedArguments.length > 0 ) {
      if(sFullUrl.charAt(sFullUrl.length - 1) !== "?") { sFullUrl += "?"; }    // If sFullUrl does not have a trailing '?' then add it
      sFullUrl += sEncodedArguments;
   }


      // ## Build fetch options ...........................................

   const oOptions = {
      method:  sBody ? 'POST' : 'GET',
      headers: { 'Content-Type': sContentType }
   };
   if( sBody ) { oOptions.body = sBody; }

   // ## Send the request and pick up the response as { type: <format>, data: <data> }

   return fetch(sFullUrl, oOptions)
   .then(async response => {
      // ### Handle response data .......................................

      if( !response.ok ) {
         const sErrorMessage = await response.clone().text();
         throw new Error(`HTTP error! status: ${response.status}, message: ${sErrorMessage}`);
      }

      // Check the content type to determine how to parse the response
      const sContentType = response.headers.get('content-type');

      if(sContentType && sContentType.includes('application/json')) {
          return response.json().then(data => ({ type: 'json', data }));
      }
      else if(sContentType && (sContentType.includes('application/xml') || sContentType.includes('text/xml'))) {
         return response.text().then(text => {
            const oDOMParser = new DOMParser();
            const xml_ = oDOMParser.parseFromString(text, "text/xml");
            return { type: 'xml', data: xml_ };
         });
      }
      else {
         return response.text().then(data => ({ type: 'text', data }));
      }
   })
   .catch(error => {
      const sError = "Error sending request:" + error.message;
      console.error(sError);
      // You could add error handling UI here
      throw error;
   });
}

})(gd);

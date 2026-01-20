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

/** ---------------------------------------------------------------------
 * Send arguments to server,
 *
 * @param {string} sBaseUrl - base URL of the server
 * @param {string} sEndpoint - endpoint with arguments added after generated domain name
 * @param {string} [sArguments] - optional arguments sent to server, each arguments is separated by newline character
 * @param {string} [sBody] - optional body sent to server
 */
oNS.SendToServer = function(sBaseUrl, sEndpoint, sArguments, sBody) {
   // Use static base URL if sBaseUrl is empty or undefined
   if(!sBaseUrl) { sBaseUrl = gd.sDefaultBaseUrl_s; }

   let sFullUrl = "";

   if(!sBaseUrl.endsWith('/') && !sBaseUrl.endsWith("?") ) { sBaseUrl += '/'; } // Ensure base URL ends with slash for proper endpoint concatenation

   sFullUrl = sBaseUrl;

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

   sFullUrl = oNS.EncodeUrlParams(sFullUrl);                                  // Encode URL parameters for first part, here you should only have simple values

   // ## If encoded arguments exist and URL contains '='
   if( sEncodedArguments.length > 0 && sFullUrl.indexOf('=') !== -1 ) {
      if(sFullUrl.charAt(sFullUrl.length - 1) !== "&") { sFullUrl += "&"; }   // If sFullUrl does not have a trailing '&' then add it
      sFullUrl += sEncodedArguments;
   }
   else if( sEncodedArguments.length > 0 ) {
      if(sFullUrl.charAt(sFullUrl.length - 1) !== "?") { sFullUrl += "?"; }   // If sFullUrl does not have a trailing '?' then add it
      sFullUrl += sEncodedArguments;
   }

   // ## Prepare fetch options ..........................................

   const oOptions = {
      method: 'GET', // Default method
      headers: { 'Content-Type': 'application/xml' }
   };

   // If body is provided, use POST method and add body
   if(sBody !== undefined) {
      oOptions.method = 'POST';
      //oOptions.body = JSON.stringify(sBody);
   }

   // ## Send the request and pick up the response as { type: <format>, data: <data> }

   return fetch(sFullUrl, oOptions)
   .then(async  response => {
      // ### Handle response data .......................................

      if(!response.ok) {
         const oResponseClone = response.clone();
         const sErrorMessage = await oResponseClone.text();
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
   .then(data => {
      // ### Handle parsed data .........................................

      return data;                                                       // Return the parsed data
   })
   .catch(error => {
      const sError = "Error sending request:" + error.message;
      console.error(sError);
      // You could add error handling UI here
      throw error;
   });
}


})(gd);

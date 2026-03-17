var gd_mapper = gd_mapper || {};

(function(oNS) {

   /** ----------------------------------------------------------------------- XML_GetFirstValue
    * Extract first value from second row in XML result. If only one result
    * node found then select that, if more than one then select first with
    * command="select". Throws if no matching node or invalid CDATA structure.
    *
    * @param {string} sXmlString - XML string with result nodes containing CDATA JSON
    * @returns {any|null} First value from second row, or null if fewer than two rows
    */
   oNS.XML_GetFirstValue = function(xml_ , sNode = "result") {
      if( typeof xml_ === "object" ) { xml_ = xml_.data; }                    // If input is an object (e.g. server response), extract the XML string from the 'data' property

      // check if xml_ isn't xml object, then try to parse it as XML string

      let aResultNodes;
      if( typeof xml_ === "string" ) {
            // ## Parse XML string and select result node
         const sXmlString = String(xml_); // Ensure the input is treated as a string
         const oParser = new DOMParser(); // Create a DOMParser to parse the XML string
         const oXmlDoc = oParser.parseFromString(sXmlString, "application/xml"); // Parse the XML string into a document
         aResultNodes = oXmlDoc.querySelectorAll(sNode);                   // Select all nodes matching the specified name (default "result")
      }
      else if( xml_ instanceof Document ) {
         // If input is already an XML Document, use it directly
         const oXmlDoc = xml_; // Use the provided XML Document
         aResultNodes = oXmlDoc.querySelectorAll(sNode); // Select all nodes matching the specified name (default "result")
      }

      let oResultNode = null;
      if( aResultNodes.length === 1 ) { oResultNode = aResultNodes[0]; }
      else if( aResultNodes.length > 1 ) { oResultNode = oXmlDoc.querySelector(sNode + "[command='select']"); }

      if( !oResultNode ) { throw new Error("No result node with command='select' found"); }

      // ## Extract CDATA content and parse JSON

      const sCData = oResultNode.textContent; // Extract CDATA content from the selected node
      let aData; // Initialize variable to hold parsed JSON data
      try { aData = JSON.parse(sCData); }
      catch( oError ) { throw new Error("CDATA is not valid JSON: " + oError.message); }

      if( !Array.isArray(aData) ) { throw new Error("CDATA does not have expected array structure"); }
      if( aData.length < 2 || !aData[1][0] ) { return null; }

      const value_ = aData[1][0]; // Extract the first value from the second row

      return value_;
   };


})(gd_mapper);   
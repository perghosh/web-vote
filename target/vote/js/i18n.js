"use strict";

/** -----------------------------------------------------------------------
 * i18n - Internationalization module
 *
 * Handles language selection, loading language files, and applying
 * translations to DOM elements marked with data-i18n attributes.
 */

let sCurrentLanguage_g = localStorage.getItem('user-language') || navigator.language.slice(0, 2) || 'sv'; // active language code (default to Swedish if not set)
let oTranslations_g = {}; // Object to hold loaded translations

/** -----------------------------------------------------------------------
 * Load language file and apply translations to DOM
 *
 * @param {string} sLanguage - Language code to load (e.g., 'sv', 'en')
 * @returns {Promise<void>}
 */
async function LoadLanguage(sLanguage)
{
   try
   {
      // Fetch language JSON file
      const oResponse = await fetch(`language/${sLanguage}.json`);
      
      if( !oResponse.ok ) { throw new Error(`Unable to load language file: ${sLanguage}`); }
      
      oTranslations_g = await oResponse.json();

      // Update HTML root lang attribute for SEO and screen readers
      const eHtmlRoot = document.getElementById('idRoot');                                         console.assert( eHtmlRoot !== null, "idRoot element required" );
      eHtmlRoot.setAttribute('lang', sLanguage);

      // Find all elements marked for translation and apply translations
      document.querySelectorAll('[data-i18n]').forEach((e_) =>
      {
         const sKey = e_.getAttribute('data-i18n');

         const sTranslatedText = sKey.split('.').reduce((oCurrent, sKey) => {
            return oCurrent && oCurrent[sKey] ? oCurrent[sKey] : null;
         }, oTranslations_g || {});         
         
         if( sTranslatedText !== null ) { e_.innerText = sTranslatedText;}
      });

      document.querySelectorAll('template').forEach((eTemplate_) => 
      {
         eTemplate_.content.querySelectorAll('[data-i18n]').forEach((e_) => {
            const sKey = e_.getAttribute('data-i18n');
            const sTranslatedText = sKey.split('.').reduce((oCurrent, sKey) => {
               return oCurrent && oCurrent[sKey] ? oCurrent[sKey] : null;
            }, oTranslations_g || {});         
            
            if( sTranslatedText !== null ) { e_.innerText = sTranslatedText;}
         });
      });


      // ## Save language choice to localStorage .............................
      localStorage.setItem('user-language', sLanguage);
      sCurrentLanguage_g = sLanguage;

   }
   catch (eError)
   {
      console.error("i18n error:", eError);
      // Fallback to Swedish if error occurs and not already attempting Swedish
      if( sLanguage !== 'sv' )
      {
         await LoadLanguage('sv');
      }
   }
}

/** -----------------------------------------------------------------------
 * Change application language
 *
 * Called when user clicks a language selection button
 *
 * @param {string} sLanguage - Language code to switch to
 */
function ChangeLanguage(sLanguage)
{
   LoadLanguage(sLanguage);
}

// Initialize language on DOM ready
document.addEventListener('DOMContentLoaded', () =>
{
   LoadLanguage(sCurrentLanguage_g);
});

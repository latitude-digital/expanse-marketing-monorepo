import {
  slk,
  surveyLocalization,
  SurveyModel,
} from "survey-core";
import {
  editorLocalization,
  QuestionAddedEvent,
  SurveyCreatorModel,
  SurveyInstanceCreatedEvent,
} from "survey-creator-core";

import { CheckboxVOIQuestion } from "../surveysjs_renderers/FDSRenderers/CheckboxVOI";
import { RadioGroupRowQuestion } from "../surveysjs_renderers/FDSRenderers/RadioButtonButton";
import { SurveyBookeoQuestion } from "../surveysjs_renderers/Bookeo";
import { SurveyQuestionMarkdown } from "../surveysjs_renderers/Markdown";
import { EmailTextInput } from "../surveysjs_renderers/EmailTextInput";
// FDS renderers are now conditionally imported in fdsInitializer.ts

import Showdown from "showdown";
import { registerIcons } from "./fontAwesomeIcons";
import { AllSurveys, FordSurveys, LincolnSurveys } from "../surveyjs_questions";
import { nativePlacesApi } from "../utils/nativePlacesApi";

console.log(
  CheckboxVOIQuestion.name,
  RadioGroupRowQuestion.name,
  SurveyBookeoQuestion.name,
  EmailTextInput.name,
  SurveyQuestionMarkdown.name,
);

const converter = new Showdown.Converter({
  openLinksInNewWindow: true,
});

registerIcons([
  "person-circle-question",
  "user",
  "house-circle-check",
  "mailbox-flag-up",
  "at",
  "phone",
  "mobile-retro",
  "signature",
  "calendar-circle-user",
  "cash-register",
  "scale-unbalanced",
  "scale-unbalanced-flip",
  "trophy",
  "envelopes-bulk",
  // Ford/Lincoln icons
  "cars",
  "thumbs-up",
  "people-arrows",
  "genderless",
  "calendar-star",
  "money-check-dollar-pen",
  "chart-bar",
  "calendar-clock",
  "pen-field",
  "car-garage",
  "road-circle-check",
  "comments",
]);

export const initSurvey = () => {
  slk(
    "NDBhNThlYzYtN2EwMy00ZTgxLWIyNGQtOGFkZWJkM2NlNjI3OzE9MjAyNi0wNy0xOSwyPTIwMjYtMDctMTksND0yMDI2LTA3LTE5"
  );

  // surveyLocalization.supportedLocales = ["en", "es"];
  
  // Add custom localized string for "(Optional)" text
  // Ensure the locale objects exist before setting properties
  if (!surveyLocalization.locales["en"]) {
    surveyLocalization.locales["en"] = {};
  }
  if (!surveyLocalization.locales["es"]) {
    surveyLocalization.locales["es"] = {};
  }
  if (!surveyLocalization.locales["fr"]) {
    surveyLocalization.locales["fr"] = {};
  }
  
  // Set custom optionalText for our custom renderers
  surveyLocalization.locales["en"]["optionalText"] = " (Optional)";
  surveyLocalization.locales["es"]["optionalText"] = " (Opcional)";
  surveyLocalization.locales["fr"]["optionalText"] = " (Optionnel)";
  
  // NOTE: Only initialize basic survey features here
  // FDS and brand-specific questions are now conditionally loaded in fdsInitializer.ts
  // This ensures admin forms use raw SurveyJS without FDS styling
};

export const initCreator = (creator: SurveyCreatorModel) => {
  creator.toolbox.showCategoryTitles = true;
  creator.toolbox.forceCompact = false;
  creator.toolbox.canCollapseCategories = true;
  creator.toolbox.allowExpandMultipleCategories = true;
  creator.toolbox.keepAllCategoriesExpanded = false;

  const themeTabPlugin = creator.themeEditor;

  // sort the themes so that the custom themes starting with __ are at the top
  if (themeTabPlugin && themeTabPlugin.availableThemes) {
    themeTabPlugin.availableThemes = themeTabPlugin.availableThemes.sort(
      (a: string, b: string) => {
      if (a.startsWith("__") && !b.startsWith("__")) {
        return -1;
      } else if (!a.startsWith("__") && b.startsWith("__")) {
        return 1;
      } else if (a.startsWith("__") && b.startsWith("__")) {
        return a.localeCompare(b); // Sort alphabetically if both start with __
      } else {
        return a.localeCompare(b); // Sort alphabetically if neither starts with __
      }
    }
  );
  }

  const enLocale = editorLocalization.getLocale("en");
  enLocale.toolboxCategories["__00pii"] = "Personal Information Questions";
  enLocale.toolboxCategories["__01fmc"] = "FMC Questions";
  enLocale.toolboxCategories["__10wav"] = "Waivers";
  enLocale.toolboxCategories["__02fordCategory"] = "Ford Questions";
  enLocale.toolboxCategories["__02lincolnCategory"] = "Lincoln Questions";

  creator.toolbox.changeCategories([
    { name: "markdown", category: "misc"},
    { name: "optin", category: "choice" },
    { name: "autocompleteaddress", category: "__00pii" },
    { name: "autocompleteaddress2", category: "__00pii" },
    { name: "autocompleteaddresscan", category: "__00pii" },
    { name: "autocompleteaddressall", category: "__00pii" },
    { name: "autocompleteaddress-intl", category: "__00pii" },
    { name: "firstname", category: "__00pii" },
    { name: "lastname", category: "__00pii" },
    { name: "email", category: "__00pii" },
    { name: "phone", category: "__00pii" },
    { name: "adultwaiver", category: "__10wav" },
    { name: "minorwaiver", category: "__10wav" },
    { name: "gender", category: "__01fmc" },
    { name: "agebracket", category: "__01fmc" },
    { name: "howlikelyacquire", category: "__01fmc" },
    { name: "inmarkettiming", category: "__01fmc" },
    { name: "vehicledrivenmostmake", category: "__01fmc" },
    // Note: Ford and Lincoln questions are now assigned dynamically 
    // in their respective brand-specific template files
  ]);

  const md = creator.toolbox.getItemByName("markdown");
  md.tooltip = "Markdown";
  md.setPropertyValue("iconName", "icon-markdown");

  // Add checkbox variant for boolean questions
  const booleanItem = creator.toolbox.getItemByName("boolean");
  if (booleanItem) {
    booleanItem.addSubitem({
      name: "checkboxBoolean",
      title: "Checkbox",
      json: {
        type: "boolean",
        renderAs: "checkbox",
        titleLocation: "hidden"
      }
    });
  }

  // sort the toolbox categories so that the custom categories starting with __ are at the top
  creator.toolbox.categories = creator.toolbox.categories.sort(
    (a: any, b: any) => {
      if (a.name.startsWith("__") && !b.name.startsWith("__")) {
        return -1;
      } else if (!a.name.startsWith("__") && b.name.startsWith("__")) {
        return 1;
      } else {
        return a.name.localeCompare(b.name);
      }
    }
  );

  // open just the first category
  creator.toolbox.collapseAllCategories();
  creator.toolbox.expandCategory("__00pii");
  creator.toolbox.updateTitles();
};

export const prepareForSurvey = (thisSurvey: SurveyModel, brand?: string) => {
  // add custom css classes
  thisSurvey.onUpdateQuestionCssClasses.add((survey, options) => {
    if (options.question.name === "signature") {
      options.cssClasses.root += " signatureInput";
    }
  });

  // add markdown support
  thisSurvey.onTextMarkdown.add(function (survey, options) {
    //convert the mardown text to html
    var str = converter.makeHtml(options.text);
    //remove root paragraphs <p></p>
    str = str.substring(3);
    str = str.substring(0, str.length - 4);
    //set html
    options.html = str;
  });

  // Log brand-aware preparation
  if (brand) {
    console.log(`Survey prepared for brand: ${brand}`);
  }
};

export const prepareSurveyOnQuestionAdded = (
  creator: SurveyCreatorModel,
  options: SurveyInstanceCreatedEvent
) => {
  console.log('prepareSurveyOnQuestionAdded called, survey questions:', 
    options.survey.getAllQuestions().map(q => ({ name: q.name, type: q.getType() })));
  
  // Function to initialize address autocomplete (native bridge or Google Places)
  const initializeAddressAutocomplete = (inputElement: HTMLInputElement, survey: any) => {
    console.log('[AddressAutocomplete] ========================================');
    console.log('[AddressAutocomplete] Initializing for input:', inputElement.name);
    console.log('[AddressAutocomplete] Input element details:', {
      name: inputElement.name,
      id: inputElement.id,
      className: inputElement.className,
      'data-testid': inputElement.getAttribute('data-testid'),
      'aria-label': inputElement.getAttribute('aria-label'),
      autocomplete: inputElement.getAttribute('autocomplete')
    });
    console.log('[AddressAutocomplete] Environment:', {
      isNative: nativePlacesApi.isRunningInNative(),
      userAgent: navigator.userAgent,
      hostname: window.location.hostname
    });

    // Check if we're in native WebView - use native bridge
    if (nativePlacesApi.isRunningInNative()) {
      console.log('[AddressAutocomplete] ➡️ Using native Places API bridge');
      initializeNativeAutocomplete(inputElement, survey);
    } else {
      console.log('[AddressAutocomplete] ➡️ Using Google Places API fallback');
      initializeGooglePlacesAutocomplete(inputElement, survey);
    }
  };

  // Native WebView implementation using bridge
  const initializeNativeAutocomplete = (inputElement: HTMLInputElement, survey: any) => {
    let debounceTimeout: any;
    let currentPredictions: any[] = [];
    let dropdownElement: HTMLDivElement | null = null;

    // Create dropdown for suggestions
    const createDropdown = () => {
      if (dropdownElement) return dropdownElement;

      dropdownElement = document.createElement('div');
      dropdownElement.className = 'native-places-dropdown';
      dropdownElement.style.cssText = `
        position: absolute;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        max-height: 300px;
        overflow-y: auto;
        z-index: 9999;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        display: none;
      `;
      document.body.appendChild(dropdownElement);
      return dropdownElement;
    };

    // Position dropdown below input
    const positionDropdown = () => {
      if (!dropdownElement) return;
      const rect = inputElement.getBoundingClientRect();
      dropdownElement.style.left = `${rect.left + window.scrollX}px`;
      dropdownElement.style.top = `${rect.bottom + window.scrollY}px`;
      dropdownElement.style.width = `${rect.width}px`;
    };

    // Show dropdown with predictions
    const showDropdown = (predictions: any[]) => {
      const dropdown = createDropdown();
      dropdown.innerHTML = '';
      currentPredictions = predictions;

      if (predictions.length === 0) {
        dropdown.style.display = 'none';
        return;
      }

      predictions.forEach((prediction, index) => {
        const item = document.createElement('div');
        item.className = 'native-places-dropdown-item';
        item.style.cssText = `
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        `;
        item.innerHTML = `
          <div style="font-weight: 500;">${prediction.mainText}</div>
          <div style="font-size: 0.9em; color: #666;">${prediction.secondaryText}</div>
        `;

        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = '#f5f5f5';
        });
        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = 'white';
        });
        item.addEventListener('click', async () => {
          await handlePredictionSelect(prediction);
        });

        dropdown.appendChild(item);
      });

      positionDropdown();
      dropdown.style.display = 'block';
    };

    // Hide dropdown
    const hideDropdown = () => {
      if (dropdownElement) {
        dropdownElement.style.display = 'none';
      }
    };

    // Handle prediction selection
    const handlePredictionSelect = async (prediction: any) => {
      try {
        console.log('[AddressAutocomplete] Fetching details for place:', prediction.placeId);

        // CRITICAL FIX: Use the current survey instance from window, not the closure variable
        const currentSurvey = (window as any).__currentSurveyInstance || survey;
        console.log('[AddressAutocomplete:Native] Using survey instance:', currentSurvey === survey ? 'original (closure)' : 'current (from window)');

        const details = await nativePlacesApi.getPlaceDetails(prediction.placeId);

        // Parse address components
        const ParsedData: Record<string, any> = {
          formatted_address: details.formattedAddress,
        };

        const postalData = details.addressComponents.find((item) =>
          item.types.includes("postal_code")
        );
        const countryData = details.addressComponents.find((item) =>
          item.types.includes("country")
        );
        const addressData = details.addressComponents.find((item) =>
          item.types.includes("administrative_area_level_1")
        );
        const cityData = details.addressComponents.find((item) =>
          item.types.includes("locality")
        );
        const routeData = details.addressComponents.find((item) =>
          item.types.includes("route")
        );
        const streetNumberData = details.addressComponents.find((item) =>
          item.types.includes("street_number")
        );

        ParsedData.address1 = [
          streetNumberData?.longName,
          routeData?.longName,
        ]
          .join(" ")
          .trim();
        ParsedData.city = cityData == null ? "" : cityData.longName;
        ParsedData.state = addressData == null ? "" : addressData.shortName;
        ParsedData.zip_code = postalData == null ? "" : postalData.longName;
        ParsedData.country = countryData == null ? "" : countryData.shortName;

        // Update survey values using current survey instance
        const isComposite = currentSurvey.getQuestionByName("address_group");
        if (isComposite) {
          currentSurvey.setValue("address_group", ParsedData);
        } else {
          [
            "address1",
            "city",
            "state",
            "zip_code",
            "country",
          ].forEach((key) => {
            try {
              currentSurvey.setValue(key, ParsedData[key]);
            } catch (e) {
              console.log("error", e);
            }
          });
        }

        hideDropdown();
      } catch (error) {
        console.error('[AddressAutocomplete] Error fetching place details:', error);
      }
    };

    // Handle input changes
    const handleInput = async (event: Event) => {
      const value = (event.target as HTMLInputElement).value;

      // Clear existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      // Hide dropdown if input is empty
      if (!value || value.length < 3) {
        hideDropdown();
        return;
      }

      // Debounce the autocomplete request
      debounceTimeout = setTimeout(async () => {
        try {
          console.log('[AddressAutocomplete] Fetching predictions for:', value);
          const predictions = await nativePlacesApi.getAutocompletePredictions(value);
          showDropdown(predictions);
        } catch (error) {
          console.error('[AddressAutocomplete] Error fetching predictions:', error);
          hideDropdown();
        }
      }, 300); // 300ms debounce
    };

    // Attach event listeners
    inputElement.addEventListener('input', handleInput);
    inputElement.addEventListener('blur', () => {
      // Delay hiding to allow click events on dropdown items
      setTimeout(hideDropdown, 200);
    });
    inputElement.addEventListener('focus', () => {
      if (currentPredictions.length > 0 && inputElement.value.length >= 3) {
        showDropdown(currentPredictions);
      }
    });

    // Cleanup on element removal
    const cleanup = () => {
      if (dropdownElement && dropdownElement.parentNode) {
        dropdownElement.parentNode.removeChild(dropdownElement);
      }
    };

    // Add cleanup listener
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node === inputElement || (node as Element).contains?.(inputElement)) {
            cleanup();
            observer.disconnect();
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  // Google Places API fallback for browsers
  const initializeGooglePlacesAutocomplete = (inputElement: HTMLInputElement, survey: any) => {
    console.log('[AddressAutocomplete:Google] Starting initialization for input:', inputElement.name);
    console.log('[AddressAutocomplete:Google] Input element:', inputElement);
    console.log('[AddressAutocomplete:Google] Survey object:', survey);

    // Check if Google Places API is available
    if (typeof google === 'undefined' || !google.maps?.places) {
      console.warn('[AddressAutocomplete] Google Places API not loaded');
      return;
    }
    console.log('[AddressAutocomplete:Google] Google Places API is available');

    // Determine country restrictions based on survey questions
    let countryRestrictions: { country: string[] | null } = { country: ["us"] }; // Default to US
    const allQuestions = survey.getAllQuestions();

    const parentQuestion = allQuestions.find((q: any) =>
      q.elements && q.elements.some((element: any) => element.name === "address1")
    );

    // First check - look for specific question types
    if (parentQuestion) {
      if (parentQuestion.getType() === "autocompleteaddresscan") {
        countryRestrictions = { country: ["ca"] };
      } else if (parentQuestion.getType() === "autocompleteaddressall" || parentQuestion.getType() === "autocompleteaddress-intl") {
        countryRestrictions = { country: null }; // No restrictions
      }
    } else {
      // Fallback check - look for Canadian address indicators in the DOM
      const hasProvince = !!document.querySelector('input[aria-label="Province"]') ||
                         !!Array.from(document.querySelectorAll('*')).find(el => el.textContent?.includes('Province'));
      const hasPostalCode = !!document.querySelector('input[aria-label="Postal Code"]') ||
                           !!Array.from(document.querySelectorAll('*')).find(el => el.textContent?.includes('Postal Code'));

      if (hasProvince && hasPostalCode) {
        countryRestrictions = { country: ["ca"] };
      }
    }

    const autocomplete = new google.maps.places.Autocomplete(
      inputElement,
      {
        types: ["address"],
        componentRestrictions: countryRestrictions,
        fields: ["address_components", "formatted_address"],
      }
    );

    console.log('[AddressAutocomplete:Google] Autocomplete instance created:', autocomplete);
    console.log('[AddressAutocomplete:Google] Adding place_changed listener');

    autocomplete.addListener("place_changed", async function () {
      console.log('[AddressAutocomplete:Google] ========== PLACE_CHANGED EVENT FIRED ==========');

      // CRITICAL FIX: Use the current survey instance from window, not the closure variable
      // This prevents stale survey references when Firebase auth state changes cause re-renders
      const currentSurvey = (window as any).__currentSurveyInstance || survey;
      console.log('[AddressAutocomplete:Google] Using survey instance:', currentSurvey === survey ? 'original (closure)' : 'current (from window)');
      console.log('[AddressAutocomplete:Google] Survey instances match:', currentSurvey === survey);

      const place = await autocomplete.getPlace();
      console.log('[AddressAutocomplete:Google] Place object received:', place);
      console.log('[AddressAutocomplete:Google] Address components:', place.address_components);

      const ParsedData: Record<string, any> = {
        formatted_address: place.formatted_address,
      };
      console.log('[AddressAutocomplete:Google] Initial ParsedData:', ParsedData);

      const postalData = place.address_components?.find((item) =>
        item.types.includes("postal_code")
      );
      const countryData = place.address_components?.find((item) =>
        item.types.includes("country")
      );
      const addressData = place.address_components?.find((item) =>
        item.types.includes("administrative_area_level_1")
      );
      const cityData = place.address_components?.find((item) =>
        item.types.includes("locality")
      );
      const routeData = place.address_components?.find((item) =>
        item.types.includes("route")
      );
      const streetNumberData = place.address_components?.find((item) =>
        item.types.includes("street_number")
      );

      ParsedData.address1 = [
        streetNumberData?.long_name,
        routeData?.long_name,
      ]
        .join(" ")
        .trim();
      ParsedData.city = cityData == null ? "" : cityData.long_name;
      ParsedData.state = addressData == null ? "" : addressData.short_name;
      ParsedData.zip_code = postalData == null ? "" : postalData.long_name;
      ParsedData.country = countryData == null ? "" : countryData.short_name;

      console.log('[AddressAutocomplete:Google] Final ParsedData:', ParsedData);

      const compositeQuestion = currentSurvey.getQuestionByName("address_group");
      console.log('[AddressAutocomplete:Google] Is composite question?', !!compositeQuestion);
      console.log('[AddressAutocomplete:Google] Composite question:', compositeQuestion);

      if (compositeQuestion) {
        console.log('[AddressAutocomplete:Google] Setting values on composite question child elements');

        // For composite questions, we need to set values on the individual child elements
        // The field mapping: address1, city, state, zip (maps to zip_code), country
        const fieldMapping = {
          'address1': 'address1',
          'city': 'city',
          'state': 'state',
          'zip': 'zip_code',    // Element name 'zip' maps to value 'zip_code'
          'country': 'country'
        };

        Object.entries(fieldMapping).forEach(([elementName, dataKey]) => {
          try {
            const childElement = compositeQuestion.getQuestionByName(elementName);
            if (childElement) {
              const value = ParsedData[dataKey];
              console.log(`[AddressAutocomplete:Google] Setting child element "${elementName}" = "${value}"`);
              childElement.value = value;
              console.log(`[AddressAutocomplete:Google] ✅ Child "${elementName}" set successfully, current value:`, childElement.value);
            } else {
              console.warn(`[AddressAutocomplete:Google] ⚠️ Child element "${elementName}" not found in composite`);
            }
          } catch (e) {
            console.error(`[AddressAutocomplete:Google] ❌ Error setting child element "${elementName}":`, e);
          }
        });

        // Also set the composite value for consistency
        try {
          currentSurvey.setValue("address_group", ParsedData);
          console.log('[AddressAutocomplete:Google] ✅ Also set composite address_group value for consistency');
        } catch (e) {
          console.error('[AddressAutocomplete:Google] ❌ Error setting composite address_group:', e);
        }
      } else {
        console.log('[AddressAutocomplete:Google] Setting individual field values (non-composite)');
        [
          "address1",
          "city",
          "state",
          "zip_code",
          "country",
        ].forEach((key) => {
          try {
            console.log(`[AddressAutocomplete:Google] Setting ${key} = ${ParsedData[key]}`);
            currentSurvey.setValue(key, ParsedData[key]);
            const newValue = currentSurvey.getValue(key);
            console.log(`[AddressAutocomplete:Google] ✅ ${key} set successfully, current value:`, newValue);
          } catch (e) {
            console.error(`[AddressAutocomplete:Google] ❌ Error setting ${key}:`, e);
          }
        });
      }

      console.log('[AddressAutocomplete:Google] ========== PLACE_CHANGED HANDLER COMPLETE ==========');
    });
  };

  // Use MutationObserver to detect when address inputs are added to the DOM
  const observeAddressInputs = () => {
    console.log('[AddressAutocomplete] Setting up MutationObserver for address inputs');
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;

              // Look for address1 inputs that have been added
              // Support both Ford UI inputs and standard SurveyJS inputs
              const addressInputs = element.querySelectorAll(
                'input[data-testid="fds-text-address1"], input[aria-label="Street Address"], input[autocomplete="address-line1"]'
              );

              if (addressInputs.length > 0) {
                console.log('[AddressAutocomplete] Found', addressInputs.length, 'address input(s) in DOM mutation');
              }

              addressInputs.forEach((input) => {
                const inputElement = input as HTMLInputElement;

                // Check if autocomplete is already initialized
                if (!inputElement.classList.contains('pac-target-input') &&
                    !inputElement.hasAttribute('data-autocomplete-initialized')) {
                  console.log('[AddressAutocomplete] Initializing autocomplete for newly added input:', inputElement);
                  inputElement.setAttribute('data-autocomplete-initialized', 'true');
                  initializeAddressAutocomplete(inputElement, options.survey);
                } else {
                  console.log('[AddressAutocomplete] Skipping already initialized input:', inputElement);
                }
              });
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check for existing address inputs that might already be in the DOM
    setTimeout(() => {
      console.log('[AddressAutocomplete] Checking for existing address inputs (after 500ms delay)');
      // Support both Ford UI inputs and standard SurveyJS inputs
      const existingAddressInputs = document.querySelectorAll(
        'input[data-testid="fds-text-address1"], input[aria-label="Street Address"], input[autocomplete="address-line1"]'
      );
      console.log('[AddressAutocomplete] Found', existingAddressInputs.length, 'existing address input(s)');

      existingAddressInputs.forEach((input) => {
        const inputElement = input as HTMLInputElement;
        if (!inputElement.classList.contains('pac-target-input') &&
            !inputElement.hasAttribute('data-autocomplete-initialized')) {
          console.log('[AddressAutocomplete] Initializing autocomplete for existing input:', inputElement);
          inputElement.setAttribute('data-autocomplete-initialized', 'true');
          initializeAddressAutocomplete(inputElement, options.survey);
        } else {
          console.log('[AddressAutocomplete] Skipping already initialized existing input:', inputElement);
        }
      });
    }, 500); // Small delay to ensure DOM is ready
  };

  // Start observing for address inputs
  observeAddressInputs();

  // Keep the original event handlers for other functionality
  options.survey.onAfterRenderQuestionInput.add((survey, questionOptions) => {
    console.log('onAfterRenderQuestionInput fired for question:', questionOptions.question.name, 
      'type:', questionOptions.question.getType());
  });
};

export const prepareCreatorOnQuestionAdded = (
  sender: SurveyCreatorModel,
  options: QuestionAddedEvent
) => {
  if (options.question.getType() === "optin") {
    options.question.descriptionLocation = "underInput";
    options.question.label = "I agree";
  }

  if (options.question.getType() === "autocompleteaddress") {
    console.log("autocompleteaddress question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "autocompleteaddress2") {
    console.log("autocompleteaddress2 question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "autocompleteaddresscan") {
    console.log("autocompleteaddresscan question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "autocompleteaddressall") {
    console.log("autocompleteaddressall question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "autocompleteaddress-intl") {
    console.log("autocompleteaddress-intl question added");
    options.question.name = "address_group";
    options.question._ffs = "address_group";
    options.question.titleLocation = "hidden";
  }

  if (options.question.getType() === "firstname") {
    console.log("firstname question added");
    options.question.name = "first_name";
    options.question._ffs = "first_name";

    options.question.locTitle.setJson({
      en: "First Name",
      es: "Nombre",
      fr: "Prénom",
    });
  }

  if (options.question.getType() === "lastname") {
    console.log("lastname question added");
    options.question.name = "last_name";
    options.question._ffs = "last_name";

    options.question.locTitle.setJson({
      en: "Last Name",
      es: "Apellidos",
      fr: "Nom de famille",
    });
  }

  if (options.question.getType() === "email") {
    console.log("email question added");
    options.question.name = "email";
    options.question._ffs = "email";

    options.question.locTitle.setJson({
      en: "Email Address",
      es: "Correo electrónico",
      fr: "Email",
    });
  }

  if (options.question.getType() === "phone") {
    console.log("phone question added");
    options.question.name = "phone";
    options.question._ffs = "phone";

    options.question.locTitle.setJson({
      en: "Mobile Number",
      es: "Teléfono",
      fr: "Téléphone",
    });

    options.question.descriptionLocation = "underInput";
    options.question.locDescription.setJson({
      en: "Standard message and data rates may apply.",
      es: "Pueden aplicar las tarifas normales para mensajes de texto y datos.",
      fr: "Les tarifs standard pour les messages et les données peuvent s'appliquer.",
    });
  }

  // FMC Question handlers - universal for all brands
  if (options.question.getType() === "gender") {
    console.log("gender question added");
    options.question.name = "gender";
    options.question._ffs = "gender";
    options.question.locTitle.setJson({
      en: "Gender?",
      es: "Sexo",
      fr: "Genre"
    });
  }

  if (options.question.getType() === "agebracket") {
    console.log("age_bracket question added");
    options.question.name = "ageBracket";
    options.question._ffs = "age_bracket";
    options.question.locTitle.setJson({
      en: "May I ask your age?",
      es: "¿Puedo preguntar su edad?",
      fr: "Puis-je vous demander votre âge?"
    });
  }

  if (options.question.getType() === "howlikelyacquire") {
    console.log("how_likely_acquire question added");
    options.question.name = "howLikelyAcquire";
    options.question._ffs = "how_likely_acquire";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en: "How do you plan to acquire your next vehicle?",
      es: "¿Cómo piensas adquirir tu próximo vehículo?",
      fr: "Comment prévoyez-vous d'acquérir votre prochain véhicule?"
    });
  }

  if (options.question.getType() === "inmarkettiming") {
    console.log("in_market_timing question added");
    options.question.name = "inMarketTiming";
    options.question._ffs = "in_market_timing";
    options.question.isRequired = true;

    options.question.locTitle.setJson({
      en: "When do you plan to acquire your next vehicle?",
      es: "¿Cuándo piensas adquirir tu próximo vehículo?",
      fr: "Quand prévoyez-vous d'acheter votre prochain véhicule?"
    });
  }

  if (options.question.getType() === "vehicledrivenmostmake") {
    console.log("vehicledrivenmostmake question added");
    options.question.name = "vehicleDrivenMostMake";
    options.question._ffs = "vehicle_driven_most_make_id";

    options.question.locTitle.setJson({
      en: "What is your current vehicle make?",
      es: "¿Cuál es la marca de su vehículo actual?",
      fr: "Quelle est la marque de votre véhicule actuel?"
    });
  }

};

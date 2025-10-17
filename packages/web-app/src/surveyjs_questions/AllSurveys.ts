/**
 * Universal SurveyJS custom question type definitions
 * 
 * ⚠️ IMPORTANT FOR DEVELOPERS:
 * This file defines question types used across all brands (Ford, Lincoln, Unbranded).
 * These are basic personal information, address, and waiver questions.
 * 
 * For brand-specific questions, see:
 * - LincolnSurveys.ts (Lincoln-specific questions)
 * - FordSurveys.ts (Ford-specific questions) 
 * - FMCSurveys.ts (FMC demographic questions)
 */

import {
  ComponentCollection,
  ElementFactory,
  ICustomQuestionTypeConfiguration,
  Question,
  Serializer,
} from "survey-core";
import {
  ICustomQuestionTypeConfigurationWaiver,
} from "./interfaces";

/**
 * Helper to safely set a property as readonly only if it's defined on the specific type
 * This prevents accidentally modifying base type properties which affects ALL questions
 */
const setPropertyReadOnly = (typeName: string, propertyName: string) => {
  const prop = Serializer.findProperty(typeName, propertyName);
  // Only set readonly if the property is defined on this specific type
  // or if it's a custom property like _ffs that we added
  if (prop && (prop.classInfo?.name === typeName || propertyName === "_ffs")) {
    prop.readOnly = true;
  }
};

const globalInit = () => {
  // Prevent double registration
  if (ComponentCollection.Instance.getCustomQuestionByName("firstname")) {
    console.log('AllSurveys already initialized, skipping...');
    return;
  }

  // Add _ffs property to both question and panel types
  // This ensures the property appears for individual questions and panel/container questions
  Serializer.addProperty("question", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("panel", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  // Add addressAutocompleteConfig property to text questions so it can be passed through
  Serializer.addProperty("text", {
    name: "addressAutocompleteConfig",
    displayName: "Address Autocomplete Config",
    type: "object",
    category: "data",
    isSerializable: true,
  });

  // Add _ffs property to custom question types that need it
  Serializer.addProperty("autocompleteaddress", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("autocompleteaddress2", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("autocompleteaddresscan", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("autocompleteaddressall", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("autocompleteaddress-intl", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("firstname", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("lastname", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("email", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("phone", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("phone-intl", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  /**
   * First Name Question
   * 
   * @description Text input for user's first name with validation
   * @_ffs "first_name" - Maps to first_name field in APIs
   * @validation Min 2 chars, starts with letter, letters/spaces/hyphens only
   * @autocomplete "given-name"
   * @required true
   */
  ComponentCollection.Instance.add({
    name: "firstname",
    title: "First Name",
    iconName: "icon-user",
    showInToolbox: true,
    inheritBaseProps: ["isRequired", "description", "visible", "enable"],
    onInit: () => {
      setPropertyReadOnly("firstname", "name");
      setPropertyReadOnly("firstname", "_ffs");
    },
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        // Sync isRequired from parent to child
        child.isRequired = question.isRequired;
      }
    },
    questionJSON: {
      type: "text",
      name: "first_name",
      title: {
        en: "First Name",
        es: "Nombre",
        fr: "Prénom",
      },
      isRequired: true,
      autocomplete: "given-name",
      validators: [
        {
          type: "text",
          text: {
            en: "Invalid First Name",
            es: "Nombre Inválido",
            fr: "Nom non valide",
          },
          minLength: 2,
        },
        // starts with a letter, can include letters, spaces, and hyphens
        {
          type: "regex",
          text: {
            en: "Invalid First Name",
            es: "Nombre Inválido",
            fr: "Nom non valide",
          },
          regex: "^[A-Za-z][A-Za-z\\s-]*$",
        },
      ],
    },
  } as ICustomQuestionTypeConfiguration);

  /**
   * Last Name Question
   * 
   * @description Text input for user's last name with validation
   * @_ffs "last_name" - Maps to last_name field in APIs
   * @validation Min 2 chars, starts with letter, letters/spaces/hyphens only
   * @autocomplete "family-name"
   * @required true
   */
  ComponentCollection.Instance.add({
    name: "lastname",
    title: "Last Name",
    iconName: "icon-user",
    showInToolbox: true,
    inheritBaseProps: ["isRequired", "description", "visible", "enable"],
    onInit: () => {
      setPropertyReadOnly("lastname", "name");
      setPropertyReadOnly("lastname", "_ffs");
    },
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        // Sync isRequired from parent to child
        child.isRequired = question.isRequired;
      }
    },
    questionJSON: {
      type: "text",
      name: "last_name",
      title: {
        en: "Last Name",
        es: "Apellidos",
        fr: "Nom de famille",
      },
      isRequired: true,
      autocomplete: "family-name",
      startWithNewLine: false,
      validators: [
        {
          type: "text",
          text: {
            en: "Invalid Last Name",
            es: "Apellido Inválido",
            fr: "Nom de famille non valide",
          },
          minLength: 2,
        },
        // starts with a letter, can include letters, spaces, and hyphens
        {
          type: "regex",
          text: {
            en: "Invalid Last Name",
            es: "Apellido Inválido",
            fr: "Nom de famille non valide",
          },
          regex: "^[A-Za-z][A-Za-z\\s-]*$",
        },
      ],
    },
  } as ICustomQuestionTypeConfiguration);

  /**
   * Google Autocomplete Address (US) Question
   * 
   * @description Multi-field address input with Google Places autocomplete (US only)
   * @_ffs "address_group" - Maps to address1, address2, city, state, zip_code, country fields
   * @autocomplete Google Places API integration
   * @validation US zip codes, state abbreviations
   * @fields address1*, address2, city*, state*, zip*, country (hidden)
   */
  ComponentCollection.Instance.add({
    name: "autocompleteaddress",
    title: "Autocomplete Address (US)",
    iconName: "icon-mailbox-flag-up",
    showInToolbox: true,
    onInit: () => {
      setPropertyReadOnly("autocompleteaddress", "name");
      setPropertyReadOnly("autocompleteaddress", "_ffs");
    },
    elementsJSON: [
      {
        type: "text",
        name: "address1",
        title: {
          en: "Street Address",
          es: "Dirección 1",
          fr: "Adresse",
        },
        isRequired: true,
        autocomplete: "address-line1",
        addressAutocompleteConfig: {
          addressPartMap: {
            address1: "address1",
            address2: "address2",
            city: "city",
            state: "state",
            zip: "zip",
          },
        },
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Address",
              es: "Dirección Inválida",
              fr: "Adresse non valide",
            },
            minLength: 5,
          },
        ],
      },
      {
        type: "text",
        name: "address2",
        startWithNewLine: false,
        title: {
          en: "Apt/Suite/Other",
          es: "Apto/Suite/Otro",
          fr: "Appartement/Suite/Autre",
        },
        autocomplete: "address-line2",
      },
      {
        type: "text",
        name: "city",
        title: {
          en: "City",
          es: "Ciudad",
          fr: "Ville",
        },
        isRequired: true,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid City",
              es: "Ciudad Inválida",
              fr: "Ville non valide",
            },
            minLength: 2,
          },
          {
            type: "regex",
            text: {
              en: "Invalid City",
              es: "Ciudad Inválida",
              fr: "Ville non valide",
            },
            regex: "^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\\s-]*$",
          },
        ],
      },
      {
        type: "text",
        name: "state",
        isRequired: true,
        startWithNewLine: false,
        title: {
          en: "State",
          es: "Provincia",
          fr: "Province",
        },
        maxLength: 2,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid State",
              es: "Provincia Inválida",
              fr: "Province non valide",
            },
            minLength: 2,
          },
          {
            type: "regex",
            text: {
              en: "Invalid State",
              es: "Provincia Inválida",
              fr: "Province non valide",
            },
            regex: "^[A-Za-z][A-Za-z\\s-]*$",
          },
        ],
      },
      {
        type: "text",
        name: "zip",
        isRequired: true,
        valueName: "zip_code",
        maxLength: "7",
        startWithNewLine: false,
        title: {
          en: "Zip Code",
          es: "Código Postal",
          fr: "Code Postal",
        },
        autocomplete: "postal-code",
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Zip",
              es: "Código Postal Inválido",
              fr: "Code Postal Non Valide",
            },
            minLength: 5,
          },
          // need regex that will match US zip codes and Canadian postal codes
          {
            type: "regex",
            text: {
              en: "Invalid Zip",
              es: "Código Postal Inválido",
              fr: "Code Postal Non Valide",
            },
            regex:
              "^[0-9]{5}(?:-[0-9]{4})?$|^[A-Za-z][0-9][A-Za-z][\\s\\-]?[0-9][A-Za-z][0-9]$",
          },
        ],
      },
      {
        // this is a hidden question that is used to store the country from google autocomplete
        type: "text",
        name: "country",
        title: {
          en: "Country",
          es: "País",
          fr: "Pays",
        },
        visible: false,
        isRequired: false,
      },
    ],
  } as ICustomQuestionTypeConfiguration);

  /**
   * Google Autocomplete Address Zip Only (US) Question
   * 
   * @description Simplified address input - requires only zip, other fields optional
   * @_ffs "address_group" - Maps to address_group field mapping
   * @autocomplete Google Places API integration
   * @validation Only zip code required, other fields optional
   * @use_case Quick address collection when full address not needed
   */
  ComponentCollection.Instance.add({
    name: "autocompleteaddress2",
    title: "Autocomplete Address Zip Only (US)",
    iconName: "icon-mailbox-flag-up",
    showInToolbox: true,
    onInit: () => {
      setPropertyReadOnly("autocompleteaddress2", "name");
      setPropertyReadOnly("autocompleteaddress2", "_ffs");
    },
    elementsJSON: [
      {
        type: "text",
        name: "address1",
        title: {
          en: "Street Address",
          es: "Dirección 1",
          fr: "Adresse",
        },
        isRequired: false,
        autocomplete: "address-line1",
        addressAutocompleteConfig: {
          addressPartMap: {
            address1: "address1",
            address2: "address2",
            city: "city",
            state: "state",
            zip: "zip",
          },
        },
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Address",
              es: "Dirección Inválida",
              fr: "Adresse non valide",
            },
            minLength: 5,
          },
        ],
      },
      {
        type: "text",
        name: "address2",
        startWithNewLine: false,
        title: {
          en: "Apt/Suite/Other",
          es: "Apto/Suite/Otro",
          fr: "Appartement/Suite/Autre",
        },
        autocomplete: "address-line2",
      },
      {
        type: "text",
        name: "city",
        title: {
          en: "City",
          es: "Ciudad",
          fr: "Ville",
        },
        isRequired: false,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid City",
              es: "Ciudad Inválida",
              fr: "Ville non valide",
            },
            minLength: 2,
          },
          {
            type: "regex",
            text: {
              en: "Invalid City",
              es: "Ciudad Inválida",
              fr: "Ville non valide",
            },
            regex: "^[A-Za-z][A-Za-z\\s-]*$",
          },
        ],
      },
      {
        type: "text",
        name: "state",
        isRequired: false,
        startWithNewLine: false,
        title: {
          en: "State",
          es: "Provincia",
          fr: "Province",
        },
        maxLength: 2,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid State",
              es: "Provincia Inválida",
              fr: "Province non valide",
            },
            minLength: 2,
          },
          {
            type: "regex",
            text: {
              en: "Invalid State",
              es: "Provincia Inválida",
              fr: "Province non valide",
            },
            regex: "^[A-Za-z][A-Za-z\\s-]*$",
          },
        ],
      },
      {
        type: "text",
        name: "zip",
        isRequired: true,
        valueName: "zip_code",
        maxLength: "7",
        startWithNewLine: false,
        title: {
          en: "Zip Code",
          es: "Código Postal",
          fr: "Code Postal",
        },
        autocomplete: "postal-code",
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Zip",
              es: "Código Postal Inválido",
              fr: "Code Postal Non Valide",
            },
            minLength: 5,
          },
          // need regex that will match US zip codes and Canadian postal codes
          {
            type: "regex",
            text: {
              en: "Invalid Zip",
              es: "Código Postal Inválido",
              fr: "Code Postal Non Valide",
            },
            regex:
              "^[0-9]{5}(?:-[0-9]{4})?$|^[A-Za-z][0-9][A-Za-z][\\s\\-]?[0-9][A-Za-z][0-9]$",
          },
        ],
      },
      {
        // this is a hidden question that is used to store the country from google autocomplete
        type: "text",
        name: "country",
        title: {
          en: "Country",
          es: "País",
          fr: "Pays",
        },
        visible: false,
        isRequired: false,
      },
    ],
  } as ICustomQuestionTypeConfiguration);

  /**
   * Google Autocomplete Address (Canada) Question
   * 
   * @description Multi-field address input with Google Places autocomplete (Canada only)
   * @_ffs "address_group" - Maps to address_group field mapping
   * @autocomplete Google Places API integration, restricted to Canada
   * @validation Canadian postal codes, province abbreviations
   * @country_restriction ["ca"] - Canada only
   */
  ComponentCollection.Instance.add({
    name: "autocompleteaddresscan",
    title: "Autocomplete Address (CAN)",
    iconName: "icon-mailbox-flag-up",
    showInToolbox: true,
    onInit: () => {
      setPropertyReadOnly("autocompleteaddresscan", "name");
      setPropertyReadOnly("autocompleteaddresscan", "_ffs");
    },
    elementsJSON: [
      {
        type: "text",
        name: "address1",
        title: {
          en: "Street Address",
          es: "Dirección 1",
          fr: "Adresse",
        },
        isRequired: true,
        autocomplete: "address-line1",
        addressAutocompleteConfig: {
          addressPartMap: {
            address1: "address1",
            address2: "address2",
            city: "city",
            state: "state",
            zip: "zip",
          },
          componentRestrictions: {
            country: ["ca"],
          },
        },
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Address",
              es: "Dirección Inválida",
              fr: "Adresse non valide",
            },
            minLength: 5,
          },
        ],
      },
      {
        type: "text",
        name: "address2",
        startWithNewLine: false,
        title: {
          en: "Apt/Suite/Other",
          es: "Apto/Suite/Otro",
          fr: "Appartement/Suite/Autre",
        },
        autocomplete: "address-line2",
      },
      {
        type: "text",
        name: "city",
        title: {
          en: "City",
          es: "Ciudad",
          fr: "Ville",
        },
        isRequired: true,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid City",
              es: "Ciudad Inválida",
              fr: "Ville non valide",
            },
            minLength: 2,
          },
          {
            type: "regex",
            text: {
              en: "Invalid City",
              es: "Ciudad Inválida",
              fr: "Ville non valide",
            },
            regex: "^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\\s-]*$",
          },
        ],
      },
      {
        type: "text",
        name: "state",
        isRequired: true,
        startWithNewLine: false,
        title: {
          en: "Province",
          es: "Provincia",
          fr: "Province",
        },
        maxLength: 2,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Province",
              es: "Provincia Inválida",
              fr: "Province non valide",
            },
            minLength: 2,
          },
          {
            type: "regex",
            text: {
              en: "Invalid Province",
              es: "Provincia Inválida",
              fr: "Province non valide",
            },
            regex: "^[A-Za-z][A-Za-z\\s-]*$",
          },
        ],
      },
      {
        type: "text",
        name: "zip",
        isRequired: true,
        valueName: "zip_code",
        maxLength: "7",
        startWithNewLine: false,
        title: {
          en: "Postal Code",
          es: "Código Postal",
          fr: "Code Postal",
        },
        autocomplete: "postal-code",
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Postal Code",
              es: "Código Postal Inválido",
              fr: "Code Postal Non Valide",
            },
            minLength: 5,
          },
          // Canadian postal code regex
          {
            type: "regex",
            text: {
              en: "Invalid Postal Code",
              es: "Código Postal Inválido",
              fr: "Code Postal Non Valide",
            },
            regex: "^[A-Za-z][0-9][A-Za-z][\\s\\-]?[0-9][A-Za-z][0-9]$",
          },
        ],
      },
      {
        // this is a hidden question that is used to store the country from google autocomplete
        type: "text",
        name: "country",
        title: {
          en: "Country",
          es: "País",
          fr: "Pays",
        },
        visible: false,
        isRequired: false,
      },
    ],
  } as ICustomQuestionTypeConfiguration);

  /**
   * Google Autocomplete Address (All Countries) Question
   * 
   * @description Multi-field address input with Google Places autocomplete (worldwide)
   * @_ffs "address_group" - Maps to address_group field mapping
   * @autocomplete Google Places API integration, no country restrictions
   * @validation Flexible validation for international addresses
   * @country_restriction None - supports all countries
   */
  ComponentCollection.Instance.add({
    name: "autocompleteaddressall",
    title: "Autocomplete Address (ALL)",
    iconName: "icon-mailbox-flag-up",
    showInToolbox: true,
    onInit: () => {
      setPropertyReadOnly("autocompleteaddressall", "name");
      setPropertyReadOnly("autocompleteaddressall", "_ffs");
    },
    elementsJSON: [
      {
        type: "text",
        name: "address1",
        title: {
          en: "Street Address",
          es: "Dirección 1",
          fr: "Adresse",
        },
        isRequired: true,
        autocomplete: "address-line1",
        addressAutocompleteConfig: {
          addressPartMap: {
            address1: "address1",
            address2: "address2",
            city: "city",
            state: "state",
            zip: "zip",
          },
          // No country restrictions for ALL version
        },
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Address",
              es: "Dirección Inválida",
              fr: "Adresse non valide",
            },
            minLength: 5,
          },
        ],
      },
      {
        type: "text",
        name: "address2",
        startWithNewLine: false,
        title: {
          en: "Apt/Suite/Other",
          es: "Apto/Suite/Otro",
          fr: "Appartement/Suite/Autre",
        },
        autocomplete: "address-line2",
      },
      {
        type: "text",
        name: "city",
        title: {
          en: "City",
          es: "Ciudad",
          fr: "Ville",
        },
        isRequired: true,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid City",
              es: "Ciudad Inválida",
              fr: "Ville non valide",
            },
            minLength: 2,
          },
          {
            type: "regex",
            text: {
              en: "Invalid City",
              es: "Ciudad Inválida",
              fr: "Ville non valide",
            },
            regex: "^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\\s-]*$",
          },
        ],
      },
      {
        type: "text",
        name: "state",
        isRequired: true,
        startWithNewLine: false,
        title: {
          en: "State/Province",
          es: "Estado/Provincia",
          fr: "État/Province",
        },
        maxLength: 10,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid State/Province",
              es: "Estado/Provincia Inválida",
              fr: "État/Province non valide",
            },
            minLength: 2,
          },
          {
            type: "regex",
            text: {
              en: "Invalid State/Province",
              es: "Estado/Provincia Inválida", 
              fr: "État/Province non valide",
            },
            regex: "^[A-Za-z][A-Za-z\\s-]*$",
          },
        ],
      },
      {
        type: "text",
        name: "zip",
        isRequired: true,
        valueName: "zip_code",
        maxLength: "12",
        startWithNewLine: false,
        title: {
          en: "Zip/Postal Code",
          es: "Código Postal",
          fr: "Code Postal",
        },
        autocomplete: "postal-code",
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Zip/Postal Code",
              es: "Código Postal Inválido",
              fr: "Code Postal Non Valide",
            },
            minLength: 3,
          },
          // Combined regex for US zip codes, Canadian postal codes, and other international formats
          {
            type: "regex",
            text: {
              en: "Invalid Zip/Postal Code",
              es: "Código Postal Inválido",
              fr: "Code Postal Non Valide",
            },
            regex: "^[0-9]{5}(?:-[0-9]{4})?$|^[A-Za-z][0-9][A-Za-z][\\s\\-]?[0-9][A-Za-z][0-9]$|^[A-Za-z0-9\\s\\-]{3,12}$",
          },
        ],
      },
      {
        // this is a hidden question that is used to store the country from google autocomplete
        type: "text",
        name: "country",
        title: {
          en: "Country",
          es: "País",
          fr: "Pays",
        },
        visible: false,
        isRequired: false,
      },
    ],
  } as ICustomQuestionTypeConfiguration);

  /**
   * Google Autocomplete Address (International with Country) Question
   *
   * @description Multi-field address input with Google Places autocomplete (worldwide) with visible country field
   * @_ffs "address_group" - Maps to address1, address2, city, state, zip_code, country fields
   * @autocomplete Google Places API integration, no country restrictions
   * @validation Flexible validation for international addresses
   * @fields address1*, address2, city*, state*, zip*, country*
   * @country_restriction None - supports all countries
   * @note Unlike autocompleteaddressall, this variant has a visible required country field
   */
  ComponentCollection.Instance.add({
    name: "autocompleteaddress-intl",
    title: "Autocomplete Address (International)",
    iconName: "icon-mailbox-flag-up",
    showInToolbox: true,
    onInit: () => {
      setPropertyReadOnly("autocompleteaddress-intl", "name");
      setPropertyReadOnly("autocompleteaddress-intl", "_ffs");
    },
    elementsJSON: [
      {
        type: "text",
        name: "address1",
        title: {
          en: "Street Address",
          es: "Dirección 1",
          fr: "Adresse",
        },
        isRequired: true,
        autocomplete: "address-line1",
        addressAutocompleteConfig: {
          addressPartMap: {
            address1: "address1",
            address2: "address2",
            city: "city",
            state: "state",
            zip: "zip",
            country: "country",
          },
          // No country restrictions for international version
        },
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Address",
              es: "Dirección Inválida",
              fr: "Adresse non valide",
            },
            minLength: 5,
          },
        ],
      },
      {
        type: "text",
        name: "address2",
        startWithNewLine: false,
        title: {
          en: "Apt/Suite/Other",
          es: "Apto/Suite/Otro",
          fr: "Appartement/Suite/Autre",
        },
        autocomplete: "address-line2",
      },
      {
        type: "text",
        name: "city",
        title: {
          en: "City",
          es: "Ciudad",
          fr: "Ville",
        },
        isRequired: true,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid City",
              es: "Ciudad Inválida",
              fr: "Ville non valide",
            },
            minLength: 2,
          },
          {
            type: "regex",
            text: {
              en: "Invalid City",
              es: "Ciudad Inválida",
              fr: "Ville non valide",
            },
            regex: "^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\\s-]*$",
          },
        ],
      },
      {
        type: "text",
        name: "state",
        isRequired: true,
        startWithNewLine: false,
        title: {
          en: "State/Province",
          es: "Estado/Provincia",
          fr: "État/Province",
        },
        maxLength: 10,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid State/Province",
              es: "Estado/Provincia Inválida",
              fr: "État/Province non valide",
            },
            minLength: 2,
          },
          {
            type: "regex",
            text: {
              en: "Invalid State/Province",
              es: "Estado/Provincia Inválida",
              fr: "État/Province non valide",
            },
            regex: "^[A-Za-z][A-Za-z\\s-]*$",
          },
        ],
      },
      {
        type: "text",
        name: "zip",
        isRequired: true,
        valueName: "zip_code",
        maxLength: "12",
        startWithNewLine: false,
        title: {
          en: "Zip/Postal Code",
          es: "Código Postal",
          fr: "Code Postal",
        },
        autocomplete: "postal-code",
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Zip/Postal Code",
              es: "Código Postal Inválido",
              fr: "Code Postal Non Valide",
            },
            minLength: 3,
          },
          // Combined regex for US zip codes, Canadian postal codes, and other international formats
          {
            type: "regex",
            text: {
              en: "Invalid Zip/Postal Code",
              es: "Código Postal Inválido",
              fr: "Code Postal Non Valide",
            },
            regex: "^[0-9]{5}(?:-[0-9]{4})?$|^[A-Za-z][0-9][A-Za-z][\\s\\-]?[0-9][A-Za-z][0-9]$|^[A-Za-z0-9\\s\\-]{3,12}$",
          },
        ],
      },
      {
        type: "text",
        name: "country",
        startWithNewLine: false,
        title: {
          en: "Country",
          es: "País",
          fr: "Pays",
        },
        autocomplete: "country-name",
        visible: true,
        isRequired: true,
        validators: [
          {
            type: "text",
            text: {
              en: "Invalid Country",
              es: "País Inválido",
              fr: "Pays non valide",
            },
            minLength: 2,
          },
        ],
      },
    ],
  } as ICustomQuestionTypeConfiguration);

  /**
   * Email Address Question
   *
   * @description Email input with validation and server-side verification
   * @_ffs "email" - Maps to email field in APIs
   * @validation Email format + server validation via validateEmail function
   * @autocomplete "email"
   * @required true
   */
  ComponentCollection.Instance.add({
    name: "email",
    title: "Email Address",
    iconName: "icon-at",
    showInToolbox: true,
    inheritBaseProps: ["isRequired", "description", "visible", "enable"],
    onInit: () => {
      setPropertyReadOnly("email", "name");
      setPropertyReadOnly("email", "_ffs");
      // REMOVED: Don't add isRequired to base types - it breaks the property grid
      // Serializer.addProperty("emailtextinput", "isRequired");
    },
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        // Sync isRequired from parent to child
        child.isRequired = question.isRequired;
      }
    },
    questionJSON: {
      type: "text",
      name: "email",
      title: {
        en: "Email Address",
        es: "Correo electrónico",
        fr: "Email",
      },
      inputType: "email",
      autocomplete: "email",
      validators: [
        {
          type: "email",
        },
        {
          type: "expression",
          text: {
            en: "Invalid Email Address",
            es: "Correo electrónico Inválido",
            fr: "Email non valide",
          },
          expression: "validateEmail({email})",
        },
      ],
    },
  } as ICustomQuestionTypeConfiguration);

  /**
   * Phone Number Question
   * 
   * @description Phone input with US formatting mask
   * @_ffs "phone" - Maps to phone field in APIs
   * @mask "999-999-9999" - US phone format
   * @autocomplete "tel"
   * @note Includes SMS consent disclaimer
   */
  ComponentCollection.Instance.add({
    name: "phone",
    title: "Phone Number",
    iconName: "icon-mobile-retro",
    showInToolbox: true,
    inheritBaseProps: ["isRequired", "description", "visible", "enable"],
    onInit: () => {
      setPropertyReadOnly("phone", "name");
      setPropertyReadOnly("phone", "_ffs");
      // REMOVED: Don't add isRequired to text type - it breaks the property grid for ALL text questions
      // Serializer.addProperty("text", "isRequired");
    },
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        // Sync isRequired from parent to child
        child.isRequired = question.isRequired;
      }
    },
    questionJSON: {
      type: "text",
      name: "phone",
      title: {
        en: "Mobile Number",
        es: "Teléfono",
        fr: "Téléphone",
      },
      description: {
        en: "Standard message and data rates may apply.",
        es: "Pueden aplicar las tarifas normales para mensajes de texto y datos.",
        fr: "Les tarifs standard pour les messages et les données peuvent s'appliquer.",
      },
      descriptionLocation: "underInput",
      inputType: "tel",
      autocomplete: "tel",
      maskType: "pattern",
      maskSettings: {
          "saveMaskedValue": true,
          "pattern": "999-999-9999"
      }
    },
  } as ICustomQuestionTypeConfiguration);

  /**
   * Phone Number (International) Question
   *
   * @description Phone input accepting both US and international formats with auto-formatting
   * @_ffs "phone" - Maps to phone field in APIs
   * @validation US format (10 digits) or International (+1-15 digits)
   * @autocomplete "tel"
   * @auto_format Live formatting as user types (US: XXX-XXX-XXXX, Intl: +X-XXX-XXX-XXXX)
   * @note No mask used - auto-formatting via onValueChanged for better UX
   */
  ComponentCollection.Instance.add({
    name: "phone-intl",
    title: "Phone (International)",
    iconName: "icon-mobile-retro",
    showInToolbox: true,
    inheritBaseProps: ["isRequired", "description", "visible", "enable"],
    onInit: () => {
      setPropertyReadOnly("phone-intl", "name");
      setPropertyReadOnly("phone-intl", "_ffs");
    },
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        // Sync isRequired from parent to child
        child.isRequired = question.isRequired;
      }
    },
    questionJSON: {
      type: "text",
      name: "phone",
      title: {
        en: "Mobile Number",
        es: "Teléfono",
        fr: "Téléphone",
      },
      placeholder: "+1-555-555-5555 or 555-555-5555",
      description: {
        en: "US format: xxx-xxx-xxxx or International: +x-xxx-xxx-xxxx",
        es: "Formato EE. UU.: xxx-xxx-xxxx o Internacional: +x-xxx-xxx-xxxx",
        fr: "Format américain : xxx-xxx-xxxx ou International : +x-xxx-xxx-xxxx",
      },
      descriptionLocation: "underInput",
      inputType: "tel",
      autocomplete: "tel",
      validators: [
        {
          type: "regex",
          regex: "^\\+?[\\d\\s\\-\\(\\)]{10,20}$",
          text: "Please enter a valid phone number (10-15 digits)"
        }
      ]
    },
  } as ICustomQuestionTypeConfiguration);

  /**
   * General Email Opt-In Question
   * 
   * @description Boolean checkbox for Ford email marketing consent
   * @_ffs Not typically set - handled by brand-specific opt-ins
   * @privacy_policy Includes Ford privacy policy link
   * @note For brand-specific opt-ins, use fordoptin or lincolnoptin instead
   */
  ComponentCollection.Instance.add({
    name: "optin",
    title: "Check Opt-In",
    iconName: "icon-checkbox",
    showInToolbox: true,
    inheritBaseProps: true,
    onLoaded(question: Question) {
      // Sync validators from parent to child for custom questions
      const child = question.contentQuestion;
      if (child && question.validators?.length > 0) {
        child.validators = [...(child.validators || []), ...question.validators];
        // Sync isRequired from parent to child
        child.isRequired = question.isRequired;
      }
    },
    questionJSON: {
      type: "boolean",
      renderAs: "checkbox",
      title: {
        en: "Please email me communications, including product and service information, surveys and special offers from Ford and its retailers.",
        es: "Por favor, envíenme comunicaciones, incluyendo información sobre productos y servicios, encuestas y ofertas especiales de Ford y sus minoristas.",
        fr: "Veuillez m'envoyer des communications, y compris des informations sur les produits et services, des enquêtes et des offres spéciales de Ford et de ses détaillants.",
      },
      description: {
        en: "Ford Motor Company respects your privacy and treats your personal information with care. **[Click here to read Ford Motor Company's privacy policy.](https://ford.com/help/privacy/)**",
        es: "Ford Motor Company respeta su confidencialidad y trata su información personal con respeto. **[Haga clic aquí para consultar la política de confidencialidad de Ford Motor Company.](https://es.ford.com/help/privacy/)**",
        fr: "Ford Motor Company respecte votre vie privée et traite vos informations personnelles avec soin. **[Cliquez ici pour lire la politique de confidentialité de Ford Motor Company.](https://ford.com/help/privacy/)**",
      },
      descriptionLocation: "underInput",
      label: "I agree",
      titleLocation: "top",
      valueTrue: "Yes",
      valueFalse: "No",
    },
  } as ICustomQuestionTypeConfiguration);

  // Add Serializer properties for waiver questions
  Serializer.addProperty("adultwaiver", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  Serializer.addProperty("minorwaiver", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  /**
   * Adult Waiver Question
   * 
   * @description Multi-field waiver with markdown text, signature, and agreement checkbox
   * @_ffs "signature" - Maps to signature field in APIs (extracted from signature object)
   * @fields waiverText (markdown), signature* (text), waiver_agree* (checkbox)
   * @signature_extraction Handles signature object -> string conversion
   * @legal Requires typed signature and checkbox agreement
   */
  ComponentCollection.Instance.add({
    name: "adultwaiver",
    title: "Adult Waiver",
    iconName: "icon-signature",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      setPropertyReadOnly("adultwaiver", "name");
      setPropertyReadOnly("adultwaiver", "_ffs");
      Serializer.addProperty("adultwaiver", {
        name: "waiverMarkdown",
        displayName: "Waiver Markdown",
        type: "text",
        category: "general",
        isSerializable: true,
      });
    },
    elementsJSON: [
      {
        type: "markdown",
        name: "waiverText",
        scrollView: true,
      },
      {
        type: "text",
        name: "signature",
        title: {
          en: "Signature",
          es: "Firma",
          fr: "Signature",
        },
        isRequired: true,
        placeholder: {
          en: "Type to Sign",
          es: "Escribe para firmar",
          fr: "Écrivez pour signer",
        },
      },
      {
        type: "checkbox",
        name: "waiver_agree",
        titleLocation: "hidden",
        isRequired: true,
        choices: [
          {
            value: 1,
            text: {
              en: "By typing your name you indicate that you have read and agree to the waiver provided here.",
              es: "Al escribir tu nombre, indicas que has leído y aceptas el acuerdo proporcionado aquí.",
              fr: "En écrivant votre nom, vous indiquez que vous avez lu et accepté l'accord fourni ici.",
            },
          },
        ],
      },
    ],
    onUpdateQuestionCssClasses(question, element, cssClasses) {
      if (question.name === "signature") {
        cssClasses.root += " signatureInput";
      }
    },
    onLoaded(question: Question) {
      // Set the _ffs property for proper API mapping
      question.setPropertyValue("_ffs", "signature");
      this.updateMarkdown(question);
    },
    onPropertyChanged(question: Question, propertyName: string, newValue: any) {
      if (propertyName === "waiverMarkdown") {
        this.updateMarkdown(question);
      }
    },
    updateMarkdown(question: Question) {
      const markdownBox = question.getQuestionByName("waiverText");
      if (!!markdownBox) {
        markdownBox.markdown = question.waiverMarkdown;
      }
    },
  } as ICustomQuestionTypeConfigurationWaiver);

  /**
   * Minor Waiver Question
   * 
   * @description Conditional waiver for events with minors - shows fields only if minors present
   * @_ffs "minor_signature" - Maps to minor_signature field (only if minorsYesNo='1')
   * @conditional All minor fields visible only if "Yes" to having minors
   * @fields minorsYesNo*, minorWaiverText, minorName1*, minorName2, minorName3, minorSignature*
   * @signature_handling Parent/guardian signature required only if minors are present
   */
  ComponentCollection.Instance.add({
    name: "minorwaiver",
    title: "Minor Waiver",
    iconName: "icon-signature",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      setPropertyReadOnly("minorwaiver", "name");
      setPropertyReadOnly("minorwaiver", "_ffs");
      Serializer.addProperty("minorwaiver", {
        name: "waiverMarkdown",
        displayName: "Waiver Markdown",
        type: "text",
        category: "general",
        isSerializable: true,
      });
    },
    elementsJSON: [
      {
        type: "radiogroup",
        renderAs: "radiobuttongroup",
        name: "minorsYesNo",
        title: {
          en: "I have minors accompanying me",
          es: "Tengo menores acompañándome",
          fr: "J'ai des mineurs avec moi",
        },
        isRequired: true,
        choices: [
          {
            value: "1",
            text: {
              en: "Yes",
              es: "Si",
              fr: "Oui",
            },
          },
          {
            value: "0",
            text: {
              en: "No",
              es: "No",
              fr: "Non",
            },
          },
        ],
      },
      {
        type: "markdown",
        name: "minorWaiverText",
        scrollView: true,
        visibleIf: "{composite.minorsYesNo} = '1'",
      },
      {
        type: "text",
        name: "minorName1",
        visibleIf: "{composite.minorsYesNo} = '1'",
        title: {
          en: "Full Name of Minor 1",
          es: "Nombre completo del menor 1",
          fr: "Nom complet du mineur 1",
        },
        isRequired: true,
      },
      {
        type: "text",
        name: "minorName2",
        visibleIf: "{composite.minorsYesNo} = '1'",
        title: {
          en: "Full Name of Minor 2",
          es: "Nombre completo del menor 2",
          fr: "Nom complet du mineur 2",
        },
      },
      {
        type: "text",
        name: "minorName3",
        visibleIf: "{composite.minorsYesNo} = '1'",
        title: {
          en: "Full Name of Minor 3",
          es: "Nombre completo del menor 3",
          fr: "Nom complet du mineur 3",
        },
      },
      {
        type: "text",
        name: "minorSignature",
        visibleIf: "{composite.minorsYesNo} = '1'",
        title: {
          en: "Parent/Guardian Signature",
          es: "Firma del padre/tutor",
          fr: "Signature du parent/tuteur",
        },
        isRequired: true,
        placeholder: "Type to Sign",
      },
    ],
    onUpdateQuestionCssClasses(question, element, cssClasses) {
      if (question.name === "minorSignature") {
        cssClasses.root += " signatureInput";
      }
    },
    onLoaded(question: Question) {
      // Set the _ffs property for proper API mapping
      question.setPropertyValue("_ffs", "minor_signature");
      this.updateMarkdown(question);
    },
    onPropertyChanged(question: Question, propertyName: string, newValue: any) {
      if (propertyName === "waiverMarkdown") {
        this.updateMarkdown(question);
      }
    },
    updateMarkdown(question: Question) {
      const markdownBox = question.getQuestionByName("minorWaiverText");
      if (!!markdownBox) {
        markdownBox.markdown = question.waiverMarkdown;
      }
    },
  } as ICustomQuestionTypeConfigurationWaiver);
};

export default {
  globalInit,
};
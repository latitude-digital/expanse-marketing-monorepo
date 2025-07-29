import {
  ComponentCollection,
  ICustomQuestionTypeConfiguration,
  Serializer,
} from "survey-core";

const globalInit = () => {

  Serializer.addProperty("question", {
    name: "_ffs",
    displayName: "FFS question",
    type: "text",
    category: "data",
    isSerializable: true,
  });

  ComponentCollection.Instance.add({
    name: "firstname",
    title: "First Name",
    iconName: "icon-person-circle-question",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.getProperty("firstname", "name").readOnly = true;
      Serializer.getProperty("firstname", "_ffs").readOnly = true;
    },
    questionJSON: {
      type: "text",
      name: "first_name",
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

  ComponentCollection.Instance.add({
    name: "lastname",
    title: "Last Name",
    iconName: "icon-person-circle-question",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.getProperty("lastname", "name").readOnly = true;
      Serializer.getProperty("lastname", "_ffs").readOnly = true;
    },
    questionJSON: {
      type: "text",
      name: "last_name",
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

  ComponentCollection.Instance.add({
    name: "autocompleteaddress",
    title: "Google Autocomplete Address",
    iconName: "icon-house-circle-check",
    showInToolbox: true,
    onInit: () => {
      Serializer.getProperty("autocompleteaddress", "name").readOnly = true;
      Serializer.getProperty("autocompleteaddress", "_ffs").readOnly = true;
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
        valueName: "country",
      },
    ],
  } as ICustomQuestionTypeConfiguration);

  ComponentCollection.Instance.add({
    name: "autocompleteaddress2",
    title: "Google Autocomplete Address Zip Only",
    iconName: "icon-house-circle-check",
    showInToolbox: true,
    onInit: () => {
      Serializer.getProperty("autocompleteaddress2", "name").readOnly = true;
      Serializer.getProperty("autocompleteaddress2", "_ffs").readOnly = true;
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
        valueName: "country",
      },
    ],
  } as ICustomQuestionTypeConfiguration);

  ComponentCollection.Instance.add({
    name: "email",
    title: "Email Address",
    iconName: "icon-at",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.getProperty("email", "name").readOnly = true;
      Serializer.getProperty("email", "_ffs").readOnly = true;
    },
    questionJSON: {
      type: "emailtextinput",
      // type: "text",
      // renderAs: "emailtextinput",
      name: "email",
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

  ComponentCollection.Instance.add({
    name: "phone",
    title: "Phone Number",
    iconName: "icon-phone",
    showInToolbox: true,
    inheritBaseProps: true,
    onInit: () => {
      Serializer.getProperty("phone", "name").readOnly = true;
      Serializer.getProperty("phone", "_ffs").readOnly = true;
    },
    questionJSON: {
      type: "text",
      name: "phone",
      inputType: "tel",
      autocomplete: "tel",
      maskType: "pattern",
      maskSettings: {
          "pattern": "999-999-9999"
      }
    },
  } as ICustomQuestionTypeConfiguration);

  ComponentCollection.Instance.add({
    name: "optin",
    title: "Check Opt-In",
    iconName: "icon-checkbox",
    showInToolbox: true,
    inheritBaseProps: true,
    questionJSON: {
      type: "boolean",
      renderAs: "checkbox",
      label: "I agree",
      titleLocation: "hidden",
      valueTrue: "Yes",
      valueFalse: "No",
    },
  } as ICustomQuestionTypeConfiguration);
};

export default {
  globalInit,
};
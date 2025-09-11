/**
 * Shared (brand-agnostic) PII question definitions
 * Always available regardless of event brand
 */

import { QuestionConfig } from '../types';

export const sharedQuestions: QuestionConfig[] = [
  // Personal information (PII)
  {
    name: 'firstname', baseType: 'text', title: 'First Name',
    properties: [{ name: '_ffs', type: 'text', default: 'firstName', visible: true }],
  },
  {
    name: 'lastname', baseType: 'text', title: 'Last Name',
    properties: [{ name: '_ffs', type: 'text', default: 'lastName', visible: true }],
  },
  {
    name: 'phone', baseType: 'text', title: 'Phone',
    properties: [{ name: '_ffs', type: 'text', default: 'phone', visible: true }],
  },
  {
    name: 'email', baseType: 'text', title: 'Email',
    properties: [{ name: '_ffs', type: 'text', default: 'email', visible: true }],
  },
  // Address
  {
    name: 'autocompleteaddress', baseType: 'text', title: 'Address (US)',
    properties: [{ name: '_ffs', type: 'text', default: 'address_group', visible: true }],
  },
  {
    name: 'autocompleteaddress2', baseType: 'text', title: 'Address Zip Only (US)',
    properties: [{ name: '_ffs', type: 'text', default: 'address_group', visible: true }],
  },
  {
    name: 'autocompleteaddresscan', baseType: 'text', title: 'Address (CAN)',
    properties: [{ name: '_ffs', type: 'text', default: 'address_group', visible: true }],
  },
  {
    name: 'autocompleteaddressall', baseType: 'text', title: 'Address (ALL)',
    properties: [{ name: '_ffs', type: 'text', default: 'address_group', visible: true }],
  },
  // Waivers (always available, dedicated category in toolbox)
  {
    name: 'adultwaiver', baseType: 'panel', title: 'Adult Waiver',
    properties: [
      { name: '_ffs', type: 'text', default: 'signature', visible: true },
      { name: 'waiverMarkdown', type: 'text', displayName: 'Waiver Markdown', category: 'general' }
    ],
    defaultValues: {
      title: "This is where we tell people to sign stuff",
      description: "We may have some helper text.",
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
      ]
    }
  },
  {
    name: 'minorwaiver', baseType: 'panel', title: 'Minor Waiver',
    properties: [{ name: '_ffs', type: 'text', default: 'minor_signature', visible: true }],
  },
];

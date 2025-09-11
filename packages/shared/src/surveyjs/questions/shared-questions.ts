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
    properties: [{ name: '_ffs', type: 'text', default: 'signature', visible: true }],
  },
  {
    name: 'minorwaiver', baseType: 'panel', title: 'Minor Waiver',
    properties: [{ name: '_ffs', type: 'text', default: 'minor_signature', visible: true }],
  },
];

import React, { useState } from "react";

import { Breadcrumbs } from "@ui/ford-ui-components/src/v2/breadcrumbs/Breadcrumbs";
import { Checkbox } from "@ui/ford-ui-components/src/v2/checkbox/Checkbox";
import { Chip } from "@ui/ford-ui-components/src/v2/chip/chip";
// import { StyledEditorialCard } from "@ui/ford-ui-components/src/v2/editorialCard/styled/StyledEditorialCard"; // Commented out due to server dependencies
import ChevronRightIcon from "@ui/ford-ui-components/src/v2/ford-icons/ChevronRightIcon";
import Icon from "@ui/ford-ui-components/src/v2/icon/Icon";
import { StyledTextField } from "@ui/ford-ui-components/src/v2/inputField/Input";
import { Notification } from "@ui/ford-ui-components/src/v2/notification/Notification";
import { StyledPagination } from "@ui/ford-ui-components/src/v2/pagination/Pagination";
import { RadioButton } from "@ui/ford-ui-components/src/v2/radio/RadioButton";
import { RadioButtonGroup } from "@ui/ford-ui-components/src/v2/radio/RadioButtonGroup";
import { SegmentedControl } from "@ui/ford-ui-components/src/v2/segmented-control/SegmentedControl";
import { SelectOption, StyledSelectDropdown } from "@ui/ford-ui-components/src/v2/selectDropdown/SelectDropdown";
import StyledSelectionCard from "@ui/ford-ui-components/src/v2/selection-card/default/StyledSelectionCard";
import { StyledButton } from "@ui/ford-ui-components/src/v2/button/Button";
import { TextArea } from "@ui/ford-ui-components/src/v2/textarea/textarea";
import { Toggle } from "@ui/ford-ui-components/src/v2/toggle/Toggle";
import { Typography } from "@ui/ford-ui-components/src/v2/typography/Typography";


const DemoScreen: React.FC = () => {
  const [currentBrand, setCurrentBrand] = useState<'ford' | 'lincoln'>('ford');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const basicOptions = [{
    value: 'basic1',
    label: 'Basic Option 1'
  }, {
    value: 'basic2',
    label: 'Basic Option 2'
  }, {
    value: 'basic3',
    label: 'Basic Option 3'
  }];
  const stateOptions = [{
    value: 'default',
    label: 'Default State'
  }, {
    value: 'disabled',
    label: 'Disabled State',
    isDisabled: true
  }, {
    value: 'selected',
    label: 'Selected State'
  }, {
    value: 'disabled-selected',
    label: 'Disabled + Selected',
    isDisabled: true,
    isSelected: true
  }];

  const sampleOptions: SelectOption[] = [
    { id: '1', label: 'Apple', value: 'apple' },
    { id: '2', label: 'Banana', value: 'banana' },
    { id: '3', label: 'Cherry', value: 'cherry' },
    { id: '4', label: 'Date', value: 'date' },
    { id: '5', label: 'Elderberry', value: 'elderberry' },
    { id: '6', label: 'Fig', value: 'fig' },
    { id: '7', label: 'Grape', value: 'grape' },
    { id: '8', label: 'Honeydew', value: 'honeydew' },
  ];

  const vehicleOptions: SelectOption[] = [
    { id: 'f150', label: 'Ford F-150', value: 'f150' },
    { id: 'mustang', label: 'Ford Mustang', value: 'mustang' },
    { id: 'explorer', label: 'Ford Explorer', value: 'explorer' },
    { id: 'escape', label: 'Ford Escape', value: 'escape' },
    { id: 'navigator', label: 'Lincoln Navigator', value: 'navigator' },
    { id: 'aviator', label: 'Lincoln Aviator', value: 'aviator' },
  ];

  const countryOptions: SelectOption[] = [
    { id: 'us', label: 'United States', value: 'US' },
    { id: 'ca', label: 'Canada', value: 'CA' },
    { id: 'mx', label: 'Mexico', value: 'MX' },
    { id: 'uk', label: 'United Kingdom', value: 'UK' },
    { id: 'de', label: 'Germany', value: 'DE' },
    { id: 'fr', label: 'France', value: 'FR' },
    { id: 'jp', label: 'Japan', value: 'JP' },
    { id: 'au', label: 'Australia', value: 'AU' },
  ];

  return (
    <div className="gdux-ford">
      <div id="fd-nxt" className={
          currentBrand === 'ford' ? `ford_${theme}` : `lincoln_${theme}`
        }>
        {/* Brand Switcher with Language Selector */}
        <div style={{
          padding: '10px',
          marginBottom: '10px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              onClick={() => {
                const nextBrand = currentBrand === 'ford' ? 'lincoln' : 'ford';
                setCurrentBrand(nextBrand);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor:
                  currentBrand === 'ford' ? '#999999' : '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Switch to {
                currentBrand === 'ford' ? 'Lincoln' :
                  currentBrand === 'lincoln' ? 'ford' :
                    'Ford'
              }
            </button>
{/* 
            <button
              onClick={() => {
                const nextTheme = theme === 'light' ? 'dark' : 'light';
                setTheme(nextTheme);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor:
                  theme === 'dark' ? '#EEEEEE' : '#333333',
                color: theme === 'dark' ? 'black' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Switch to {
                theme === 'light' ? 'dark' : 'light'
              }
            </button> */}

            <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>
              Current Style: {currentBrand}-{theme}
            </span>
          </div>
        </div>
        <div>
          <div>
            <div>
              <h3>Breadcrumbs</h3>

              <Breadcrumbs
                items={[
                  {
                    'data-testid': 'breadcrumb-home',
                    href: '/',
                    id: '1',
                    label: 'Home'
                  },
                  {
                    'data-testid': 'breadcrumb-products',
                    href: '/products',
                    id: '2',
                    label: 'Products'
                  },
                  {
                    'data-testid': 'breadcrumb-accessories',
                    href: '/products/accessories',
                    id: '3',
                    label: 'Accessories'
                  },
                  {
                    'data-testid': 'breadcrumb-current',
                    id: '4',
                    isCurrent: true,
                    label: 'Current Page'
                  }
                ]}
                separator={<ChevronRightIcon name="check" />}
                size="md"
                variant="default"
              />
            </div>
            <div>
              <h3>Button</h3>

              <div className="space-y-8 bg-gray-50 p-6">
                {/* Light Background Variants */}
                <div className="space-y-6 rounded-lg bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold">Light Background</h3>

                  {/* Primary Buttons */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600">Primary</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton emphasis="default" endIcon={{
                        name: 'chevronRight'
                      }} startIcon={{
                        name: 'chevronLeft'
                      }} variant="primary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="high" endIcon={{
                        name: 'chevronRight'
                      }} startIcon={{
                        name: 'chevronLeft'
                      }} variant="primary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="default" endIcon={{
                        name: 'chevronRight'
                      }} startIcon={{
                        name: 'chevronLeft'
                      }} variant="primary">
                        Label
                      </StyledButton>
                    </div>
                  </div>

                  {/* Secondary Buttons */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600">Secondary</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="secondary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="high" startIcon={{
                        name: 'chevronLeft'
                      }} variant="secondary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="secondary">
                        Label
                      </StyledButton>
                    </div>
                  </div>

                  {/* Disabled States */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600">Disabled</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton isDisabled emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="primary">
                        Label
                      </StyledButton>
                      <StyledButton isDisabled emphasis="high" startIcon={{
                        name: 'chevronLeft'
                      }} variant="secondary">
                        Label
                      </StyledButton>
                    </div>
                  </div>

                  {/* Tertiary / Text Buttons */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600">Tertiary / Text</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="tertiary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="high" startIcon={{
                        name: 'chevronLeft'
                      }} variant="tertiary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="tertiary">
                        Label
                      </StyledButton>
                    </div>
                  </div>

                  {/* Different Shapes/Styles */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600">Different Styles</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton className="rounded-full" emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="primary">
                        Label
                      </StyledButton>
                      <StyledButton className="rounded-full" emphasis="high" startIcon={{
                        name: 'chevronLeft'
                      }} variant="secondary">
                        Label
                      </StyledButton>
                    </div>
                  </div>

                  {/* Text Only Buttons */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600">Text Only</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton emphasis="default" variant="tertiary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="high" variant="tertiary">
                        Label
                      </StyledButton>
                    </div>
                  </div>

                  {/* Focused States */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-600">Focused States (Keyboard Navigation)</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton className="ring-ford-stroke-strongest(focus) ring-2 ring-offset-2" emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="primary">
                        Focused Primary
                      </StyledButton>
                      <StyledButton className="ring-ford-stroke-strongest(focus) ring-2 ring-offset-2" emphasis="high" endIcon={{
                        name: 'chevronRight'
                      }} variant="secondary">
                        Focused Secondary
                      </StyledButton>
                      <StyledButton className="ring-ford-stroke-strongest(focus) ring-2 ring-offset-2" emphasis="default" variant="tertiary">
                        Focused Tertiary
                      </StyledButton>
                    </div>
                  </div>
                </div>

                {/* Dark Background Variants */}
                <div className="space-y-6 rounded-lg bg-gray-900 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Dark Background</h3>

                  {/* Primary Buttons on Dark */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-300">Primary</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="primary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="primary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="default" endIcon={{
                        name: 'chevronRight'
                      }} variant="primary">
                        Label
                      </StyledButton>
                    </div>
                  </div>

                  {/* Secondary Buttons on Dark */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-300">Secondary</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="secondary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="secondary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="default" endIcon={{
                        name: 'chevronRight'
                      }} variant="secondary">
                        Label
                      </StyledButton>
                    </div>
                  </div>

                  {/* Tertiary Buttons on Dark */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-300">Tertiary</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="tertiary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="tertiary">
                        Label
                      </StyledButton>
                      <StyledButton emphasis="default" endIcon={{
                        name: 'chevronRight'
                      }} variant="tertiary">
                        Label
                      </StyledButton>
                    </div>
                  </div>

                  {/* Disabled on Dark */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-300">Disabled</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton isDisabled emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="primary">
                        Label
                      </StyledButton>
                      <StyledButton isDisabled emphasis="default" endIcon={{
                        name: 'chevronRight'
                      }} variant="secondary">
                        Label
                      </StyledButton>
                    </div>
                  </div>

                  {/* Focused States on Dark */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-300">Focused States</h4>
                    <div className="flex flex-wrap gap-4">
                      <StyledButton className="ring-ford-stroke-strongest ring-2 ring-offset-2 ring-offset-gray-900" emphasis="default" startIcon={{
                        name: 'chevronLeft'
                      }} variant="primary">
                        Focused Primary
                      </StyledButton>
                      <StyledButton className="ring-ford-stroke-strongest ring-2 ring-offset-2 ring-offset-gray-900" emphasis="default" endIcon={{
                        name: 'chevronRight'
                      }} variant="secondary">
                        Focused Secondary
                      </StyledButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3>Checkbox</h3>

              <div className="max-w-md space-y-3">
                <Checkbox>Default checkbox</Checkbox>

                <Checkbox isSelected>Selected checkbox</Checkbox>

                <Checkbox selectedCollapsed>Selected Collapsed checkbox</Checkbox>

                <Checkbox isDisabled>Disabled checkbox</Checkbox>

                <Checkbox isDisabled isSelected>
                  Disabled and selected checkbox
                </Checkbox>

                <Checkbox isInvalid>Invalid checkbox with error state</Checkbox>

                <Checkbox isInvalid errorMessage="This field is required">
                  Invalid checkbox with error message
                </Checkbox>

                <Checkbox isRequired>Required checkbox *</Checkbox>

                <Checkbox isInvalid isRequired errorMessage="You must accept the terms and conditions">
                  Required checkbox with validation error
                </Checkbox>

                <Checkbox isRequired isSelected>
                  A very long checkbox label that demonstrates how the text wraps when it exceeds the available width of the
                  container. A very long checkbox label that demonstrates how the text wraps when it exceeds the available width of
                  the container. A very long checkbox label that demonstrates how the text wraps when it exceeds the available width
                  of the container.
                </Checkbox>
              </div>
            </div>
            <div>
              <h3>Chip</h3>

              <div style={{
                padding: '8px',
                fontFamily: 'system-ui, sans-serif'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0'
                }}>
                  <thead>
                    <tr>
                      <th style={{
                        padding: '10px',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#1f2937',
                        width: '120px'
                      }}>
                        Size
                      </th>
                      <th style={{
                        padding: '10px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#1f2937',
                        minWidth: '120px'
                      }}>
                        Solid
                      </th>
                      <th style={{
                        padding: '10px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#1f2937',
                        minWidth: '140px'
                      }}>
                        Solid Outline
                      </th>
                      <th style={{
                        padding: '10px',
                        textAlign: 'center',
                        fontWeight: '600',
                        fontSize: '13px',
                        color: '#1f2937',
                        minWidth: '120px'
                      }}>
                        White Fill
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Default Color Group */}
                    <tr>
                      <th colSpan={4} style={{
                        padding: '12px 10px 8px',
                        textAlign: 'left',
                        fontWeight: '700',
                        fontSize: '16px',
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Default
                      </th>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Large
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="large" variant="default" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="large" variant="default" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="large" variant="default" />
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Medium
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="medium" variant="default" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="medium" variant="default" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="medium" variant="default" />
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px 16px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Small
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="small" variant="default" />
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="small" variant="default" />
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="small" variant="default" />
                      </td>
                    </tr>

                    {/* Informational Color Group */}
                    <tr>
                      <th colSpan={4} style={{
                        padding: '12px 10px 8px',
                        textAlign: 'left',
                        fontWeight: '700',
                        fontSize: '16px',
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Informational
                      </th>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Large
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="large" variant="informational" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="large" variant="informational" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="large" variant="informational" />
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Medium
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="medium" variant="informational" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="medium" variant="informational" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="medium" variant="informational" />
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px 16px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Small
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="small" variant="informational" />
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="small" variant="informational" />
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="small" variant="informational" />
                      </td>
                    </tr>

                    {/* Success Color Group */}
                    <tr>
                      <th colSpan={4} style={{
                        padding: '12px 10px 8px',
                        textAlign: 'left',
                        fontWeight: '700',
                        fontSize: '16px',
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Success
                      </th>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Large
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="large" variant="success" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="large" variant="success" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="large" variant="success" />
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Medium
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="medium" variant="success" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="medium" variant="success" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="medium" variant="success" />
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px 16px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Small
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="small" variant="success" />
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="small" variant="success" />
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="small" variant="success" />
                      </td>
                    </tr>

                    {/* Caution Color Group */}
                    <tr>
                      <th colSpan={4} style={{
                        padding: '12px 10px 8px',
                        textAlign: 'left',
                        fontWeight: '700',
                        fontSize: '16px',
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Caution
                      </th>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Large
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="large" variant="caution" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="large" variant="caution" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="large" variant="caution" />
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Medium
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="medium" variant="caution" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="medium" variant="caution" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="medium" variant="caution" />
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '16px 20px 32px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Small
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="small" variant="caution" />
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="small" variant="caution" />
                      </td>
                      <td style={{
                        padding: '8px 8px 16px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="small" variant="caution" />
                      </td>
                    </tr>

                    {/* Danger Color Group */}
                    <tr>
                      <th colSpan={4} style={{
                        padding: '12px 10px 8px',
                        textAlign: 'left',
                        fontWeight: '700',
                        fontSize: '16px',
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Danger
                      </th>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Large
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="large" variant="danger" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="large" variant="danger" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="large" variant="danger" />
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Medium
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="medium" variant="danger" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="medium" variant="danger" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="medium" variant="danger" />
                      </td>
                    </tr>
                    <tr>
                      <td style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: '500',
                        fontSize: '13px',
                        color: '#6b7280',
                        verticalAlign: 'middle'
                      }}>
                        Small
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solid" label="Label" size="small" variant="danger" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="solidoutline" label="Label" size="small" variant="danger" />
                      </td>
                      <td style={{
                        padding: '8px',
                        textAlign: 'center',
                        verticalAlign: 'middle'
                      }}>
                        <Chip emphasis="whitefill" label="Label" size="small" variant="danger" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {/* <div>
              <h3>Editorial Card</h3>

              <div
                style={{
                  maxWidth: 400
                }}
              >
                <StyledEditorialCard
                  body="This is a short body copy that describes the content of the card."
                  elektronImage={{
                    alt: 'Ford F-150',
                    dataTestid: 'hero-img',
                    fallbackUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&auto=format&fit=crop',
                    height: 600,
                    prioritizeImage: true,
                    src: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80&auto=format&fit=crop',
                    width: 600
                  }}
                  title="Title Here"
                />
              </div>
            </div> */}
            {/* Editorial Card temporarily disabled due to server dependencies */}
            <div>
              <h3>Icon</h3>

              <div className="w-full max-w-4xl p-6">
                <h1 className="mb-8 text-xl font-semibold">All Available Icons</h1>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                  {['check', 'checkCircle', 'checkCircleFilled', 'chevronDown', 'close', 'errorCircle', 'errorCircleFilled', 'info', 'infoFilled', 'star', 'starFilled', 'starHalf', 'visibility', 'visibilityOff', 'warning', 'warningFilled'].map(name => <div key={name} className="flex flex-col items-center justify-center rounded-md border p-3 hover:bg-gray-50">
                    <div className="mb-2 flex h-10 items-center justify-center">
                      <Icon height="24" name={name} width="24" />
                    </div>
                    <code className="text-center font-mono text-xs text-gray-600">{name}</code>
                  </div>)}
                </div>
              </div>
            </div>
            <div>
              <h3>Input Field</h3>

              <div className="max-w-md space-y-6">
                <StyledTextField description="We'll never share your email with anyone else" label="Email Address" placeholder="Enter your email" type="email" />
                <StyledTextField isRequired description="Username must be unique" label="Username" placeholder="Enter username" value="forduser" />
                <StyledTextField description="Input with search icon" label="Search Input" leftIcon={<Icon height={20} name="star" width={20} />} placeholder="Search..." type="search" />
                <StyledTextField description="Input with both left and right icons" label="Dual Icon Input" leftIcon={<Icon height={20} name="star" width={20} />} placeholder="Favorite item..." rightIcon={<Icon height={18} name="check" width={18} />} onRightIconClick={() => console.log('Check clicked')} />
                <StyledTextField description="Navigation input with chevron icons" label="Navigation Input" leftIcon={<Icon height={20} name="chevronLeft" width={20} />} placeholder="Navigate..." rightIcon={<Icon height={20} name="chevronRight" width={20} />} onRightIconClick={() => console.log('Next clicked')} />
                <StyledTextField isDisabled defaultValue="Ford Motor Company" label="Company" placeholder="Company name" />
                <StyledTextField defaultValue="John Doe" label="Full Name" placeholder="Enter your full name" successMessage="Name looks good!" />
                <StyledTextField isInvalid defaultValue="123" errorMessage="Password must be at least 8 characters" label="Password" placeholder="Enter password" type="password" />
                <StyledTextField isReadOnly defaultValue="EMP001234" description="This field cannot be edited" label="Employee ID" />
              </div>
            </div>
            <div>
              <h3>Notification</h3>

              <div className="flex w-full max-w-4xl flex-col gap-12 px-6 py-8">
                <div className="border-b pb-10">
                  <h2 className="mb-8 text-center text-xl font-semibold">Banner Notification</h2>
                  <div className="grid grid-cols-[120px_1fr] gap-y-8">
                    <div className="flex items-start justify-end pr-6 pt-4">
                      <span className="text-sm font-medium text-gray-600">Error</span>
                    </div>
                    <div>
                      <Notification message="Message Lorem ipsum dolor sit amet, consectetur adipiscing elit." title="Lorem ipsum dolor sit amet." type="error" variant="banner" />
                    </div>

                    <div className="flex items-start justify-end pr-6 pt-4">
                      <span className="text-sm font-medium text-gray-600">Warning</span>
                    </div>
                    <div>
                      <Notification message="Message Lorem ipsum dolor sit amet, consectetur adipiscing elit." title="Lorem ipsum dolor sit amet." type="warning" variant="banner" />
                    </div>

                    <div className="flex items-start justify-end pr-6 pt-4">
                      <span className="text-sm font-medium text-gray-600">Success</span>
                    </div>
                    <div>
                      <Notification message="Message Lorem ipsum dolor sit amet, consectetur adipiscing elit." title="Lorem ipsum dolor sit amet." type="success" variant="banner" />
                    </div>

                    <div className="flex items-start justify-end pr-6 pt-4">
                      <span className="text-sm font-medium text-gray-600">Informational</span>
                    </div>
                    <div>
                      <Notification message="Message Lorem ipsum dolor sit amet, consectetur adipiscing elit." title="Lorem ipsum dolor sit amet." type="informational" variant="banner" />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="mb-8 text-center text-xl font-semibold">Inline Notification</h2>
                  <div className="grid grid-cols-[120px_1fr] gap-y-8">
                    <div className="flex items-start justify-end pr-6 pt-1">
                      <span className="text-sm font-medium text-gray-600">Error</span>
                    </div>
                    <div>
                      <Notification message="Message Lorem ipsum dolor sit amet, consectetur adipiscing elit." title="Optional Title" type="error" variant="inline" />
                    </div>

                    <div className="flex items-start justify-end pr-6 pt-1">
                      <span className="text-sm font-medium text-gray-600">Warning</span>
                    </div>
                    <div>
                      <Notification message="Message Lorem ipsum dolor sit amet, consectetur adipiscing elit." title="Optional Title" type="warning" variant="inline" />
                    </div>

                    <div className="flex items-start justify-end pr-6 pt-1">
                      <span className="text-sm font-medium text-gray-600">Success</span>
                    </div>
                    <div>
                      <Notification message="Message Lorem ipsum dolor sit amet, consectetur adipiscing elit." title="Optional Title" type="success" variant="inline" />
                    </div>

                    <div className="flex items-start justify-end pr-6 pt-1">
                      <span className="text-sm font-medium text-gray-600">Informational</span>
                    </div>
                    <div>
                      <Notification message="Message Lorem ipsum dolor sit amet, consectetur adipiscing elit." title="Optional Title" type="informational" variant="inline" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3>Pagination</h3>

              <StyledPagination
                currentPage={1}
                itemsPerPageConfig={{
                  onChange: () => { },
                  options: [
                    10,
                    20,
                    50,
                    100,
                    200
                  ],
                  value: 10
                }}
                onPageChange={() => { }}
                showItemsPerPageSelector
                totalPages={10}
              />
            </div>
            <div>
              <h3>RadioButtonGroup</h3>

              <div className="space-y-8 p-6">
                <div>
                  <h3 className="mb-4 text-lg font-semibold">Basic Usage</h3>
                  <RadioButtonGroup groupLabel="Basic Radio Group" name="basic-group" options={basicOptions} width="hug" />
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-semibold">All States</h3>
                  <RadioButtonGroup groupLabel="All States Radio Group" name="states-group" options={stateOptions} width="hug" />
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-semibold">With Error State</h3>
                  <RadioButtonGroup errorMessage="Please select a valid option" groupLabel="Radio Group with Error" isInvalid={true} name="error-group" options={[{
                    value: 'error1',
                    label: 'Error Option 1'
                  }, {
                    value: 'error2',
                    label: 'Error Option 2'
                  }]} width="hug" />
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-semibold">Custom Render Item</h3>
                  <RadioButtonGroup groupLabel="Custom Rendered Options" name="custom-render-group" options={[{
                    value: 'custom1',
                    label: 'Custom Option 1',
                    description: 'Additional info for option 1'
                  }, {
                    value: 'custom2',
                    label: 'Custom Option 2',
                    description: 'Additional info for option 2'
                  }]} renderItem={item => <RadioButton key={item.value} isDisabled={item.isDisabled} name={item.name} value={item.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-sm text-gray-500">{item.description}</span>
                    </div>
                  </RadioButton>} width="hug" />
                </div>
              </div>
            </div>
            <div>
              <h3>SegmentedControl</h3>
              <SegmentedControl
                aria-label="Select your payment method"
                className="w-[400px]"
                defaultSelectedKey="lease"
                tabs={[
                  {
                    key: 'finance',
                    label: 'Finance'
                  },
                  {
                    key: 'lease',
                    label: 'Lease'
                  },
                  {
                    key: 'cash',
                    label: 'Cash'
                  }
                ]}
                variant="forms"
              />
            </div>
            <div>
              <h3>SelectDropdown</h3>

              <div className="max-w-md space-y-6">
                <StyledSelectDropdown description="Choose your favorite fruit from our selection" label="Preferred Fruit" options={sampleOptions} placeholder="Select a fruit..." />

                <StyledSelectDropdown isRequired description="Select your vehicle model from Ford/Lincoln lineup" label="Vehicle Model" options={vehicleOptions} placeholder="Choose your vehicle" selectedKey="mustang" />

                <StyledSelectDropdown isDisabled label="Disabled Field" options={vehicleOptions} placeholder="This field is disabled" selectedKey="f150" />

                <StyledSelectDropdown label="Success State" options={countryOptions} placeholder="Select your country" selectedKey="us" successMessage="Country selection saved successfully!" />

                <StyledSelectDropdown isInvalid errorMessage="Please select a valid vehicle model" label="Error State" options={vehicleOptions} placeholder="Select a vehicle" />
              </div>
            </div>
            <div>
              <h3>Selection Card</h3>

              <StyledSelectionCard
                description="This is a default selection card"
                headline="Selection Card"
                tags={[
                  'default',
                  'selection'
                ]}
                variant="none"
              />
            </div>
            <div>
              <h3>TextArea Field</h3>

              <div className="space-y-6 max-w-md">
                <TextArea description="Please provide detailed feedback about your experience" label="Customer Feedback" placeholder="Enter your feedback here..." rows={4} />

                <TextArea isRequired description="This will be displayed publicly" label="Product Review" placeholder="Write your review..." rows={6} value="This product exceeded my expectations..." />

                <TextArea isDisabled defaultValue="This field is disabled and cannot be edited." label="Terms and Conditions" placeholder="Terms content..." rows={4} />

                <TextArea defaultValue="Great service and excellent customer support!" label="Success Example" placeholder="Enter your testimonial..." rows={3} successMessage="Thank you for your feedback!" />

                <TextArea isInvalid defaultValue="Too short" errorMessage="Comment must be at least 20 characters long" label="Comments" placeholder="Enter your comments..." rows={4} />

                <TextArea isReadOnly defaultValue="Employee ID: EMP001234\nDepartment: Engineering\nManager: John Smith" description="This field cannot be edited" label="Employee Information" rows={3} />

                <TextArea showCharacterCount description="Maximum 500 characters allowed" label="Description with Character Count" maxLength={500} placeholder="Describe your project..." rows={5} />

                <TextArea showCharacterCount characterCountText="{remaining} characters left of {max} total" description="Custom character count message" label="Custom Character Count" maxLength={250} placeholder="Type your message..." rows={4} />
              </div>
            </div>
            <div>
              <h3>Toggle</h3>

              <div className="space-y-6 max-w-md">
                <Toggle data-testid="interactive-1" isSelected={true}>
                  Feature is enabled
                </Toggle>
                <Toggle data-testid="interactive-2" isSelected={false}>
                  Feature is disabled
                </Toggle>
              </div>
            </div>
            <div>
              <h3>Typography</h3>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Display Variants (large/small sizes, regular/semibold weights)</h3>
                  <Typography size="large" variant="display1" weight="regular">
                    Display 1 Large Regular - The largest text for hero sections
                  </Typography>
                  <Typography size="small" variant="display1" weight="semibold">
                    Display 1 Small Semibold - Smaller hero text
                  </Typography>
                  <Typography size="large" variant="display2" weight="regular">
                    Display 2 Large Regular - Secondary large text
                  </Typography>
                  <Typography size="small" variant="display3" weight="semibold">
                    Display 3 Small Semibold - Tertiary display text
                  </Typography>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Headline Variants (large/small sizes, regular/semibold weights)</h3>
                  <Typography size="large" variant="headline1" weight="regular">
                    Headline 1 Large Regular - Primary section headings
                  </Typography>
                  <Typography size="small" variant="headline2" weight="semibold">
                    Headline 2 Small Semibold - Secondary section headings
                  </Typography>
                  <Typography size="large" variant="headline3" weight="regular">
                    Headline 3 Large Regular - Tertiary section headings
                  </Typography>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Title Variant (medium size only, medium/semibold weights)</h3>
                  <Typography size="medium" variant="title" weight="medium">
                    Title Medium - Card titles and sub-section headers
                  </Typography>
                  <Typography size="medium" variant="title" weight="semibold">
                    Title Semibold - Emphasized card titles
                  </Typography>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Subtitle Variant (regular size only, regular/semibold weights)</h3>
                  <Typography size="regular" variant="subtitle" weight="regular">
                    Subtitle Regular - Supporting text for titles
                  </Typography>
                  <Typography size="regular" variant="subtitle" weight="semibold">
                    Subtitle Semibold - Emphasized supporting text
                  </Typography>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Body Variants (regular size only, all weights available)</h3>
                  <Typography size="regular" variant="body1" weight="light">
                    Body 1 Light - Light body text for secondary content
                  </Typography>
                  <Typography size="regular" variant="body1" weight="regular">
                    Body 1 Regular - Standard body text for main content
                  </Typography>
                  <Typography size="regular" variant="body1" weight="medium">
                    Body 1 Medium - Slightly emphasized body text
                  </Typography>
                  <Typography size="regular" variant="body1" weight="semibold">
                    Body 1 Semibold - Important body text
                  </Typography>
                  <Typography size="regular" variant="body1" weight="bold">
                    Body 1 Bold - Highly emphasized body text
                  </Typography>
                  <Typography size="regular" variant="body2" weight="regular">
                    Body 2 Regular - Secondary body text, smaller than Body 1
                  </Typography>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Caption Variant (regular size only, regular/medium/semibold/bold weights)
                  </h3>
                  <Typography size="regular" variant="caption" weight="regular">
                    Caption Regular - Small text for metadata, labels, and footnotes
                  </Typography>
                  <Typography size="regular" variant="caption" weight="medium">
                    Caption Medium - Slightly emphasized small text
                  </Typography>
                  <Typography size="regular" variant="caption" weight="semibold">
                    Caption Semibold - Important small text
                  </Typography>
                  <Typography size="regular" variant="caption" weight="bold">
                    Caption Bold - Highly emphasized small text
                  </Typography>
                </div>
              </div>

              <div className="space-y-2">
                <Typography color="current" variant="body1">
                  Current color (default)
                </Typography>
                <Typography color="moderate" variant="body1">
                  Moderate text color
                </Typography>
                <Typography color="subtle" variant="body1">
                  Subtle text color
                </Typography>
                <Typography color="interactive" variant="body1">
                  Interactive text color
                </Typography>
                <Typography color="danger" variant="body1">
                  Danger text color
                </Typography>
                <Typography color="success" variant="body1">
                  Success text color
                </Typography>
                <Typography color="brand-strong" variant="body1">
                  Brand strong color
                </Typography>
              </div>

              <div className="space-y-4">
                <Typography align="left" variant="body1">
                  Left aligned text
                </Typography>
                <Typography align="center" variant="body1">
                  Center aligned text
                </Typography>
                <Typography align="right" variant="body1">
                  Right aligned text
                </Typography>
                <Typography align="justify" variant="body1">
                  Justified text that will wrap to multiple lines to demonstrate the justify alignment behavior when there is
                  enough content to span across the container width.
                </Typography>
              </div>

              <div className="space-y-2">
                <Typography decoration="none" variant="body1">
                  No decoration (default)
                </Typography>
                <Typography decoration="underline" variant="body1">
                  Underlined text
                </Typography>
                <Typography decoration="overline" variant="body1">
                  Overlined text
                </Typography>
                <Typography decoration="line-through" variant="body1">
                  Line-through text
                </Typography>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoScreen;
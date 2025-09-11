import React, { useState, useEffect } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { SparkPostTemplate } from '@meridian-event-tech/shared';
import { httpsCallable } from 'firebase/functions';
import functions from '../services/functions';

interface EmailTemplateComboboxProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  id?: string;
}

export const EmailTemplateCombobox: React.FC<EmailTemplateComboboxProps> = ({
  value,
  onChange,
  label,
  required = false,
  id
}) => {
  const [templates, setTemplates] = useState<SparkPostTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the namespace from environment variables
        const namespace = import.meta.env.VITE_FIREBASE_NAMESPACE || 'staging';
        const fetchSparkPostTemplates = httpsCallable<{}, { success: boolean; templates: SparkPostTemplate[]; error?: string }>(
          functions,
          `${namespace}-fetchSparkPostTemplates`
        );
        
        const result = await fetchSparkPostTemplates({});
        
        if (result.data.success) {
          setTemplates(result.data.templates);
        } else {
          setError(result.data.error || 'Failed to fetch templates');
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Failed to fetch email templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const filteredTemplates =
    query === ''
      ? templates
      : templates.filter((template) => {
          const searchQuery = query.toLowerCase();
          return (
            template.name.toLowerCase().includes(searchQuery) ||
            template.id.toLowerCase().includes(searchQuery)
          );
        });

  const selectedTemplate = templates.find(t => t.id === value);

  return (
    <div>
      <label htmlFor={id} className="block text-sm/6 font-medium text-gray-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-2 relative">
        <Combobox value={value} onChange={onChange}>
          <div className="relative">
            <ComboboxInput
              id={id}
              className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
              displayValue={(templateId: string) => {
                const template = templates.find(t => t.id === templateId);
                return template ? template.name : templateId;
              }}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={loading ? "Loading templates..." : "Select a template"}
              disabled={loading}
              autoComplete="off"
            />
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </ComboboxButton>
          </div>
          {!loading && filteredTemplates.length > 0 && (
            <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
              {filteredTemplates.map((template) => (
                <ComboboxOption
                  key={template.id}
                  value={template.id}
                  className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
                >
                  <div className="flex flex-col">
                    <span className="truncate group-data-[selected]:font-semibold">
                      {template.name}
                    </span>
                    <span className="text-xs text-gray-500 group-data-[focus]:text-indigo-200 truncate">
                      {template.id}
                    </span>
                  </div>
                  <span className="absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-600 group-data-[selected]:flex group-data-[focus]:text-white">
                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          )}
        </Combobox>
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      {selectedTemplate && (
        <p className="mt-1 text-xs text-gray-500">
          <a
            href={`https://app.sparkpost.com/templates/edit/${selectedTemplate.id}/published/content`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Edit Template →
          </a>
        </p>
      )}
    </div>
  );
};

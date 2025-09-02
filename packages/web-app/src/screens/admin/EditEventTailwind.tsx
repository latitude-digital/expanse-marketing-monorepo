import { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, Timestamp, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions, setDoc, updateDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/20/solid';
import moment from 'moment';
import { SurveyModel } from 'survey-core';

import auth from '../../services/auth';
import db from '../../services/firestore';
import { EmailTemplateCombobox } from '../../components/EmailTemplateCombobox';
import { PreEventCombobox } from '../../components/PreEventCombobox';

// Event converter (same as legacy)
const EEventConverter: FirestoreDataConverter<ExpanseEvent> = {
    toFirestore(event: ExpanseEvent): DocumentData {
        const surveyModel = event.surveyJSModel || event.questions || {};
        const themeModel = event.surveyJSTheme || event.theme || {};
        
        return {
            ...event,
            brand: event.brand || null,
            questions: typeof surveyModel === 'string' ? surveyModel : JSON.stringify(surveyModel),
            surveyJSModel: typeof surveyModel === 'string' ? JSON.parse(surveyModel) : surveyModel,
            theme: typeof themeModel === 'string' ? themeModel : JSON.stringify(themeModel),
            surveyJSTheme: typeof themeModel === 'string' ? JSON.parse(themeModel) : themeModel,
            preRegDate: event.preRegDate ? Timestamp.fromDate(moment(event.preRegDate).startOf('day').toDate()) : null,
            startDate: Timestamp.fromDate(moment(event.startDate).startOf('day').toDate()),
            endDate: Timestamp.fromDate(moment(event.endDate).endOf('day').toDate()),
            fordEventID: event.fordEventID || null,
            lincolnEventID: event.lincolnEventID || null,
            surveyType: event.surveyType || null,
            _preEventID: event._preEventID || null,
            thanks: event.thanks || null,
            confirmationEmail: event.confirmationEmail || null,
            reminderEmail: event.reminderEmail || null,
            thankYouEmail: event.thankYouEmail || null,
            autoCheckOut: event.autoCheckOut || null,
            checkOutEmail: event.checkOutEmail || null,
            checkInDisplay: event.checkInDisplay || null,
            survey_count_limit: event.survey_count_limit || null,
            limit_reached_message: event.limit_reached_message || null,
            showLanguageChooser: event.showLanguageChooser !== undefined ? event.showLanguageChooser : false,
            showHeader: event.showHeader !== undefined ? event.showHeader : true,
            showFooter: event.showFooter !== undefined ? event.showFooter : true,
            tags: event.tags || [],
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): ExpanseEvent {
        const data = snapshot.data(options);
        
        return {
            ...data,
            eventID: snapshot.id,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            preRegDate: data.preRegDate ? data.preRegDate.toDate() : null,
            questions: data.questions,
            surveyJSModel: data.surveyJSModel,
            theme: data.theme,
            surveyJSTheme: data.surveyJSTheme,
            checkInDisplay: data.checkInDisplay,
        } as ExpanseEvent;
    },
};

interface Tag {
    id: string;
    name: string;
    color: string;
    description?: string;
}

interface TagComboboxProps {
    availableTags: Tag[];
    selectedTags: string[];
    onChange: (tags: string[]) => void;
}

interface CheckInDisplayEntry {
    questionId: string;
    displayName: string;
}

function TagCombobox({ availableTags, selectedTags, onChange }: TagComboboxProps) {
    const [query, setQuery] = useState('');
    
    // Ensure selectedTags is always an array
    const safeSelectedTags = selectedTags || [];
    
    const filteredTags = query === ''
        ? availableTags
        : availableTags.filter((tag) => {
            return tag.name.toLowerCase().includes(query.toLowerCase()) &&
                   !safeSelectedTags.includes(tag.id);
        });
    
    const selectedTagObjects = availableTags.filter(tag => safeSelectedTags.includes(tag.id));
    
    const handleAddTag = (tagId: string) => {
        if (!safeSelectedTags.includes(tagId)) {
            onChange([...safeSelectedTags, tagId]);
        }
        setQuery('');
    };
    
    const handleRemoveTag = (tagId: string) => {
        onChange(safeSelectedTags.filter(id => id !== tagId));
    };
    
    // Helper function to get lighter tint
    const getLighterTint = (hex: string, opacity: number = 0.1) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };
    
    // Helper function to calculate contrast and return appropriate text color
    const getContrastTextColor = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        // Calculate relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Check contrast ratios for WCAG AAA compliance (7:1)
        // Dark text on light background needs luminance > 0.56 for 7:1 ratio
        // Light text on dark background needs luminance < 0.18 for 7:1 ratio
        
        if (luminance > 0.56) {
            return '#000000'; // Use black text for light backgrounds
        } else if (luminance < 0.18) {
            return '#FFFFFF'; // Use white text for dark backgrounds
        } else {
            // For middle-range colors, calculate actual contrast
            const blackContrast = (luminance + 0.05) / 0.05;
            const whiteContrast = 1.05 / (luminance + 0.05);
            
            // Choose the color that provides better contrast
            return whiteContrast >= 7 ? '#FFFFFF' : 
                   blackContrast >= 7 ? '#000000' : 
                   whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
        }
    };
    
    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedTagObjects.map(tag => (
                    <span
                        key={tag.id}
                        className="inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-sm font-medium"
                        style={{
                            backgroundColor: getLighterTint(tag.color, 0.1),
                            color: getContrastTextColor(tag.color),
                            border: `1px solid ${tag.color}`,
                        }}
                    >
                        {tag.name}
                        <button
                            type="button"
                            onClick={() => handleRemoveTag(tag.id)}
                            className="group relative -mr-1 h-4 w-4 rounded-sm hover:bg-gray-500/20"
                        >
                            <XMarkIcon 
                                className="h-4 w-4" 
                                style={{ color: getContrastTextColor(tag.color) }}
                            />
                        </button>
                    </span>
                ))}
            </div>
            
            <Combobox as="div" value={null} onChange={handleAddTag}>
                <div className="relative">
                    <ComboboxInput
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                        placeholder="Search tags..."
                        onChange={(event) => setQuery(event.target.value)}
                        value={query}
                        autoComplete="off"
                    />
                    <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
                        <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </ComboboxButton>
                    
                    {filteredTags.length > 0 && (
                        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredTags.map((tag) => (
                                <ComboboxOption
                                    key={tag.id}
                                    value={tag.id}
                                    className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-[#257180] data-[focus]:text-white"
                                >
                                    <div className="flex items-center">
                                        <span
                                            className="inline-block h-3 w-3 flex-shrink-0 rounded-full mr-3"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span className="truncate">{tag.name}</span>
                                    </div>
                                </ComboboxOption>
                            ))}
                        </ComboboxOptions>
                    )}
                </div>
            </Combobox>
        </div>
    );
}

export default function EditEventTailwind() {
    const navigate = useNavigate();
    const { eventID } = useParams();
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availableTags, setAvailableTags] = useState<Tag[]>([]);
    const [surveyQuestions, setSurveyQuestions] = useState<Array<{value: string, text: string}>>([]);
    
    // Form state with all fields from legacy
    const [formData, setFormData] = useState<ExpanseEvent>({
        eventID: '',
        name: '',
        startDate: new Date(),
        endDate: new Date(),
        preRegDate: null,
        brand: 'Other',
        fordEventID: null,
        lincolnEventID: null,
        surveyType: null,
        _preEventID: null,
        thanks: null,
        confirmationEmail: null,
        reminderEmail: null,
        thankYouEmail: null,
        autoCheckOut: null,
        checkOutEmail: null,
        checkInDisplay: null,
        survey_count_limit: null,
        limit_reached_message: null,
        showLanguageChooser: false,
        showHeader: true,
        showFooter: true,
        tags: [],
        questions: '{}',
        surveyJSModel: {},
        theme: '{}',
        surveyJSTheme: {},
    });
    
    // Additional form state for UI toggles
    const [enablePreRegistration, setEnablePreRegistration] = useState(false);
    const [sendThankYouEmail, setSendThankYouEmail] = useState(false);
    const [thankYouEmailTiming, setThankYouEmailTiming] = useState<'immediate' | 'daysAfter'>('immediate');
    const [thankYouEmailDaysAfter, setThankYouEmailDaysAfter] = useState(1);
    const [enableAutoCheckOut, setEnableAutoCheckOut] = useState(false);
    const [checkInDisplayMatrix, setCheckInDisplayMatrix] = useState<CheckInDisplayEntry[]>([]);
    
    useEffect(() => {
        loadTags();
        if (eventID && eventID !== 'new') {
            loadEvent(eventID);
        } else {
            setLoading(false);
        }
    }, [eventID]);
    
    useEffect(() => {
        // Load survey questions if we have them
        if (formData.questions && formData.eventID !== 'new') {
            try {
                const questionsObj = typeof formData.questions === 'string' ? 
                    JSON.parse(formData.questions) : formData.questions;
                
                const tempSurvey = new SurveyModel(questionsObj);
                const questionChoices: Array<{value: string, text: string}> = [];
                
                const allQuestions = tempSurvey.getAllQuestions();
                allQuestions.forEach((question: any) => {
                    const questionType = question.getType();
                    if (questionType !== 'panel' && questionType !== 'paneldynamic' && question.name) {
                        questionChoices.push({
                            value: question.name,
                            text: question.title || question.name
                        });
                    }
                });
                
                setSurveyQuestions(questionChoices);
            } catch (error) {
                console.error("Error loading survey questions:", error);
            }
        }
    }, [formData.questions, formData.eventID]);
    
    const loadTags = async () => {
        try {
            const tagsQuery = query(
                collection(db, 'tags'),
                orderBy('name', 'asc')
            );
            const snapshot = await getDocs(tagsQuery);
            const tagsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Tag));
            setAvailableTags(tagsData);
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    };
    
    const loadEvent = async (id: string) => {
        try {
            const eventRef = doc(db, 'events', id).withConverter(EEventConverter);
            const eventSnap = await getDoc(eventRef);
            
            if (eventSnap.exists()) {
                const eventData = eventSnap.data();
                setFormData({
                    ...eventData,
                    tags: eventData.tags || []
                });
                
                // Set UI toggle states based on loaded data
                setEnablePreRegistration(!!eventData.preRegDate || !!eventData.confirmationEmail || !!eventData.reminderEmail);
                setSendThankYouEmail(!!eventData.thankYouEmail);
                if (eventData.thankYouEmail) {
                    setThankYouEmailTiming(eventData.thankYouEmail.sendNow ? 'immediate' : 'daysAfter');
                    setThankYouEmailDaysAfter(eventData.thankYouEmail.sendNowAfterDays || 1);
                }
                setEnableAutoCheckOut(!!eventData.autoCheckOut);
                
                // Convert checkInDisplay to matrix format
                if (eventData.checkInDisplay) {
                    const matrix = Object.entries(eventData.checkInDisplay).map(([questionId, displayName]) => ({
                        questionId,
                        displayName: displayName as string
                    }));
                    setCheckInDisplayMatrix(matrix);
                }
            } else {
                console.error('Event not found');
                navigate('/admin');
            }
        } catch (error) {
            console.error('Error loading event:', error);
            navigate('/admin');
        } finally {
            setLoading(false);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        try {
            // Validate required fields
            if (!formData.eventID || !formData.name || !formData.startDate || !formData.endDate) {
                alert('Please fill in all required fields');
                setSaving(false);
                return;
            }
            
            // Validate dates
            const start = moment(formData.startDate);
            const end = moment(formData.endDate);
            if (end.isBefore(start)) {
                alert('End date must be after start date');
                setSaving(false);
                return;
            }
            
            // Build event data with email configurations
            const eventData: ExpanseEvent = {
                ...formData,
                // Clear surveyType if both fordEventID and lincolnEventID are empty
                surveyType: (!formData.fordEventID && !formData.lincolnEventID) ? null : formData.surveyType,
            };
            
            // Handle pre-registration vs thank you email toggle
            if (enablePreRegistration) {
                eventData.thankYouEmail = null;
                // Keep preRegDate, confirmationEmail, reminderEmail as they are in formData
            } else {
                eventData.preRegDate = null;
                eventData.confirmationEmail = null;
                eventData.reminderEmail = null;
                
                if (sendThankYouEmail && formData.thankYouEmail?.template) {
                    eventData.thankYouEmail = {
                        template: formData.thankYouEmail.template,
                        sendNow: thankYouEmailTiming === 'immediate',
                        sendNowAfterDays: thankYouEmailTiming === 'daysAfter' ? thankYouEmailDaysAfter : undefined,
                    };
                } else {
                    eventData.thankYouEmail = null;
                }
            }
            
            // Handle auto-checkout
            if (!enableAutoCheckOut) {
                eventData.autoCheckOut = null;
            }
            
            // Convert checkInDisplay matrix back to object format
            if (checkInDisplayMatrix.length > 0) {
                const checkInDisplay: Record<string, string> = {};
                checkInDisplayMatrix.forEach(item => {
                    if (item.questionId && item.displayName) {
                        checkInDisplay[item.questionId] = item.displayName;
                    }
                });
                eventData.checkInDisplay = checkInDisplay;
            } else {
                eventData.checkInDisplay = null;
            }
            
            const eventRef = doc(db, 'events', eventData.eventID).withConverter(EEventConverter);
            
            if (eventID === 'new') {
                // Check if ID already exists
                const existingEvent = await getDoc(eventRef);
                if (existingEvent.exists()) {
                    alert('An event with this ID already exists');
                    setSaving(false);
                    return;
                }
                await setDoc(eventRef, eventData);
            } else {
                await updateDoc(eventRef, EEventConverter.toFirestore(eventData));
            }
            
            navigate('/admin');
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Error saving event. Please try again.');
        } finally {
            setSaving(false);
        }
    };
    
    const handleAddCheckInDisplay = () => {
        setCheckInDisplayMatrix([...checkInDisplayMatrix, { questionId: '', displayName: '' }]);
    };
    
    const handleRemoveCheckInDisplay = (index: number) => {
        const newMatrix = [...checkInDisplayMatrix];
        newMatrix.splice(index, 1);
        setCheckInDisplayMatrix(newMatrix);
    };
    
    const handleCheckInDisplayChange = (index: number, field: 'questionId' | 'displayName', value: string) => {
        const newMatrix = [...checkInDisplayMatrix];
        newMatrix[index][field] = value;
        setCheckInDisplayMatrix(newMatrix);
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }
    
    return (
        <form onSubmit={handleSubmit} className="divide-y divide-gray-900/10">
            {/* Basic Information Section */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-10 md:grid-cols-3">
                <div className="px-4 sm:px-0">
                    <h2 className="text-base/7 font-semibold text-gray-900">Basic Information</h2>
                    <p className="mt-1 text-sm/6 text-gray-600">
                        Core event details and configuration.
                    </p>
                </div>

                <div className="bg-white shadow-xs outline outline-gray-900/5 sm:rounded-xl md:col-span-2">
                    <div className="px-4 py-6 sm:p-8">
                        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="eventID" className="block text-sm/6 font-medium text-gray-900">
                                    Event ID <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        id="eventID"
                                        required
                                        disabled={eventID !== 'new'}
                                        value={formData.eventID}
                                        onChange={(e) => setFormData({ ...formData, eventID: e.target.value })}
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6 disabled:bg-gray-50 disabled:text-gray-500"
                                        autoComplete="off"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    The Event ID also serves as the URL {window.location.origin}/s/{formData.eventID || '{id}'}
                                </p>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="name" className="block text-sm/6 font-medium text-gray-900">
                                    Event Name <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="text"
                                        autoComplete="off"
                                        id="name"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="startDate" className="block text-sm/6 font-medium text-gray-900">
                                    Event Start <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="date"
                                        autoComplete="off"
                                        id="startDate"
                                        required
                                        value={moment(formData.startDate).format('YYYY-MM-DD')}
                                        onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="endDate" className="block text-sm/6 font-medium text-gray-900">
                                    Event End <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-2">
                                    <input
                                        type="date"
                                        autoComplete="off"
                                        id="endDate"
                                        required
                                        value={moment(formData.endDate).format('YYYY-MM-DD')}
                                        onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value) })}
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="brand" className="block text-sm/6 font-medium text-gray-900">
                                    Event Brand
                                </label>
                                <div className="mt-2">
                                    <select
                                        id="brand"
                                        value={formData.brand || 'Other'}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value || 'Other' })}
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                    >
                                        <option value="Other">Other (Default)</option>
                                        <option value="Ford">Ford</option>
                                        <option value="Lincoln">Lincoln</option>
                                    </select>
                                </div>
                            </div>

                            <div className="col-span-full">
                                <label htmlFor="tags" className="block text-sm/6 font-medium text-gray-900">
                                    Tags
                                </label>
                                <div className="mt-2">
                                    <TagCombobox
                                        availableTags={availableTags}
                                        selectedTags={formData.tags}
                                        onChange={(tags) => setFormData({ ...formData, tags })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Brand-Specific Configuration */}
            {(formData.brand === 'Ford' || formData.brand === 'Lincoln') && (
                <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-10 md:grid-cols-3">
                    <div className="px-4 sm:px-0">
                        <h2 className="text-base/7 font-semibold text-gray-900">
                            {formData.brand === 'Ford' ? 'Ford' : 'Lincoln'} Event Configuration
                        </h2>
                        <p className="mt-1 text-sm/6 text-gray-600">
                            Brand-specific settings and identifiers.
                        </p>
                    </div>

                    <div className="bg-white shadow-xs outline outline-gray-900/5 sm:rounded-xl md:col-span-2">
                        <div className="px-4 py-6 sm:p-8">
                            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                                {formData.brand === 'Ford' && (
                                    <>
                                        <div className="sm:col-span-3">
                                            <label htmlFor="fordEventID" className="block text-sm/6 font-medium text-gray-900">
                                                Ford Event ID
                                            </label>
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                        autoComplete="off"
                                                    id="fordEventID"
                                                    value={formData.fordEventID || ''}
                                                    onChange={(e) => setFormData({ ...formData, fordEventID: e.target.value || null })}
                                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                The ID of the event in Ford's system
                                            </p>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="surveyType" className="block text-sm/6 font-medium text-gray-900">
                                                Survey Type
                                            </label>
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                        autoComplete="off"
                                                    id="surveyType"
                                                    value={formData.surveyType || ''}
                                                    onChange={(e) => setFormData({ ...formData, surveyType: e.target.value || null })}
                                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                The type of survey/event in Ford's system
                                            </p>
                                        </div>

                                        <div className="col-span-full space-y-6">
                                            <div className="flex gap-3">
                                                <div className="flex h-6 shrink-0 items-center">
                                                    <div className="group grid size-4 grid-cols-1">
                                                        <input
                                                            id="fordShowHeader"
                                                            type="checkbox"
                                                            checked={formData.showHeader}
                                                            onChange={(e) => setFormData({ ...formData, showHeader: e.target.checked })}
                                                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#257180] checked:bg-[#257180] indeterminate:border-[#257180] indeterminate:bg-[#257180] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                                                        />
                                                        <svg
                                                            fill="none"
                                                            viewBox="0 0 14 14"
                                                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                                                        >
                                                            <path
                                                                d="M3 8L6 11L11 3.5"
                                                                strokeWidth={2}
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="opacity-0 group-has-checked:opacity-100"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="text-sm/6">
                                                    <label htmlFor="fordShowHeader" className="font-medium text-gray-900">
                                                        Show Header
                                                    </label>
                                                    <p className="text-gray-500">Display Ford branding header</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="flex h-6 shrink-0 items-center">
                                                    <div className="group grid size-4 grid-cols-1">
                                                        <input
                                                            id="fordShowFooter"
                                                            type="checkbox"
                                                            checked={formData.showFooter}
                                                            onChange={(e) => setFormData({ ...formData, showFooter: e.target.checked })}
                                                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#257180] checked:bg-[#257180] indeterminate:border-[#257180] indeterminate:bg-[#257180] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                                                        />
                                                        <svg
                                                            fill="none"
                                                            viewBox="0 0 14 14"
                                                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                                                        >
                                                            <path
                                                                d="M3 8L6 11L11 3.5"
                                                                strokeWidth={2}
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="opacity-0 group-has-checked:opacity-100"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="text-sm/6">
                                                    <label htmlFor="fordShowFooter" className="font-medium text-gray-900">
                                                        Show Footer
                                                    </label>
                                                    <p className="text-gray-500">Display Ford branding footer</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                                
                                {formData.brand === 'Lincoln' && (
                                    <>
                                        <div className="sm:col-span-3">
                                            <label htmlFor="lincolnEventID" className="block text-sm/6 font-medium text-gray-900">
                                                Lincoln Event ID
                                            </label>
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                        autoComplete="off"
                                                    id="lincolnEventID"
                                                    value={formData.lincolnEventID || ''}
                                                    onChange={(e) => setFormData({ ...formData, lincolnEventID: e.target.value || null })}
                                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                The ID of the event in Lincoln's system
                                            </p>
                                        </div>

                                        <div className="sm:col-span-3">
                                            <label htmlFor="lincolnSurveyType" className="block text-sm/6 font-medium text-gray-900">
                                                Survey Type
                                            </label>
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                        autoComplete="off"
                                                    id="lincolnSurveyType"
                                                    value={formData.surveyType || ''}
                                                    onChange={(e) => setFormData({ ...formData, surveyType: e.target.value || null })}
                                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">
                                                The type of survey/event in Lincoln's system
                                            </p>
                                        </div>

                                        <div className="col-span-full space-y-6">
                                            <div className="flex gap-3">
                                                <div className="flex h-6 shrink-0 items-center">
                                                    <div className="group grid size-4 grid-cols-1">
                                                        <input
                                                            id="lincolnShowHeader"
                                                            type="checkbox"
                                                            checked={formData.showHeader}
                                                            onChange={(e) => setFormData({ ...formData, showHeader: e.target.checked })}
                                                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#257180] checked:bg-[#257180] indeterminate:border-[#257180] indeterminate:bg-[#257180] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                                                        />
                                                        <svg
                                                            fill="none"
                                                            viewBox="0 0 14 14"
                                                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                                                        >
                                                            <path
                                                                d="M3 8L6 11L11 3.5"
                                                                strokeWidth={2}
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="opacity-0 group-has-checked:opacity-100"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="text-sm/6">
                                                    <label htmlFor="lincolnShowHeader" className="font-medium text-gray-900">
                                                        Show Header
                                                    </label>
                                                    <p className="text-gray-500">Display Lincoln branding header</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <div className="flex h-6 shrink-0 items-center">
                                                    <div className="group grid size-4 grid-cols-1">
                                                        <input
                                                            id="lincolnShowFooter"
                                                            type="checkbox"
                                                            checked={formData.showFooter}
                                                            onChange={(e) => setFormData({ ...formData, showFooter: e.target.checked })}
                                                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#257180] checked:bg-[#257180] indeterminate:border-[#257180] indeterminate:bg-[#257180] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                                                        />
                                                        <svg
                                                            fill="none"
                                                            viewBox="0 0 14 14"
                                                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                                                        >
                                                            <path
                                                                d="M3 8L6 11L11 3.5"
                                                                strokeWidth={2}
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                className="opacity-0 group-has-checked:opacity-100"
                                                            />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="text-sm/6">
                                                    <label htmlFor="lincolnShowFooter" className="font-medium text-gray-900">
                                                        Show Footer
                                                    </label>
                                                    <p className="text-gray-500">Display Lincoln branding footer</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pre/Post Event Configuration */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-10 md:grid-cols-3">
                <div className="px-4 sm:px-0">
                    <h2 className="text-base/7 font-semibold text-gray-900">Pre/Post Event Configuration</h2>
                    <p className="mt-1 text-sm/6 text-gray-600">
                        Configure pre-registration, thank you emails, and check-out settings.
                    </p>
                </div>

                <div className="bg-white shadow-xs outline outline-gray-900/5 sm:rounded-xl md:col-span-2">
                    <div className="px-4 py-6 sm:p-8">
                        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                                <PreEventCombobox
                                    label="Pre-Event Expanse ID"
                                    value={formData._preEventID || ''}
                                    onChange={(value) => setFormData({ ...formData, _preEventID: value || null })}
                                    startDate={formData.startDate}
                                    currentEventId={eventID === 'new' ? null : eventID}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    The Expanse ID of the pre-event
                                </p>
                            </div>

                            {(formData._preEventID || formData.surveyType === 'preTD') && (
                                <div className="sm:col-span-3 sm:col-start-4">
                                    <EmailTemplateCombobox
                                        label="Check-Out Email Template"
                                        value={formData.checkOutEmail?.template || ''}
                                        onChange={(template) => setFormData({ 
                                            ...formData, 
                                            checkOutEmail: template ? { template } : null 
                                        })}
                                    />
                                </div>
                            )}

                            <div className="col-span-full">
                                <div className="flex gap-3">
                                    <div className="flex h-6 shrink-0 items-center">
                                        <div className="group grid size-4 grid-cols-1">
                                            <input
                                                id="enablePreRegistration"
                                                type="checkbox"
                                                checked={enablePreRegistration}
                                                onChange={(e) => setEnablePreRegistration(e.target.checked)}
                                                className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#257180] checked:bg-[#257180] indeterminate:border-[#257180] indeterminate:bg-[#257180] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                                            />
                                            <svg
                                                fill="none"
                                                viewBox="0 0 14 14"
                                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                                            >
                                                <path
                                                    d="M3 8L6 11L11 3.5"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="opacity-0 group-has-checked:opacity-100"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-sm/6">
                                        <label htmlFor="enablePreRegistration" className="font-medium text-gray-900">
                                            Enable Pre-registration?
                                        </label>
                                        <p className="text-gray-500">Allow attendees to register before the event</p>
                                    </div>
                                </div>
                            </div>

                            {enablePreRegistration && (
                                <>
                                    <div className="sm:col-span-3 sm:col-start-1">
                                        <label htmlFor="preRegDate" className="block text-sm/6 font-medium text-gray-900">
                                            Begin Pre-registration on
                                        </label>
                                        <div className="mt-2">
                                            <input
                                                type="date"
                                        autoComplete="off"
                                                id="preRegDate"
                                                value={formData.preRegDate ? moment(formData.preRegDate).format('YYYY-MM-DD') : ''}
                                                onChange={(e) => setFormData({ 
                                                    ...formData, 
                                                    preRegDate: e.target.value ? new Date(e.target.value) : null 
                                                })}
                                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-3">
                                        <EmailTemplateCombobox
                                            label="Confirmation Email Template"
                                            value={formData.confirmationEmail?.template || ''}
                                            onChange={(template) => setFormData({ 
                                                ...formData, 
                                                confirmationEmail: template ? { template } : null 
                                            })}
                                        />
                                    </div>

                                    <div className="sm:col-span-3 sm:col-start-4">
                                        <EmailTemplateCombobox
                                            label="Reminder Email Template"
                                            value={formData.reminderEmail?.template || ''}
                                            onChange={(template) => {
                                                setFormData({ 
                                                    ...formData, 
                                                    reminderEmail: template ? {
                                                        template,
                                                        daysBefore: formData.reminderEmail?.daysBefore || 1,
                                                        sendHour: formData.reminderEmail?.sendHour || 9
                                                    } : null 
                                                });
                                            }}
                                        />
                                    </div>

                                    {formData.reminderEmail?.template && (
                                        <>
                                            <div className="sm:col-span-2 sm:col-start-1">
                                                <label htmlFor="reminderEmailDaysBefore" className="block text-sm/6 font-medium text-gray-900">
                                                    Days Before Event Start <span className="text-red-500">*</span>
                                                </label>
                                                <div className="mt-2">
                                                    <input
                                                        type="number"
                                        autoComplete="off"
                                                        id="reminderEmailDaysBefore"
                                                        min="1"
                                                        required
                                                        value={formData.reminderEmail?.daysBefore || 1}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            reminderEmail: formData.reminderEmail ? {
                                                                ...formData.reminderEmail,
                                                                daysBefore: parseInt(e.target.value) || 1
                                                            } : null
                                                        })}
                                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                                    />
                                                </div>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label htmlFor="reminderEmailSendHour" className="block text-sm/6 font-medium text-gray-900">
                                                    Send Hour (24-hour) <span className="text-red-500">*</span>
                                                </label>
                                                <div className="mt-2">
                                                    <input
                                                        type="number"
                                        autoComplete="off"
                                                        id="reminderEmailSendHour"
                                                        min="0"
                                                        max="23"
                                                        required
                                                        value={formData.reminderEmail?.sendHour || 9}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            reminderEmail: formData.reminderEmail ? {
                                                                ...formData.reminderEmail,
                                                                sendHour: parseInt(e.target.value) || 9
                                                            } : null
                                                        })}
                                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {!enablePreRegistration && (
                                <>
                                    <div className="col-span-full mt-4">
                                        <div className="flex gap-3">
                                            <div className="flex h-6 shrink-0 items-center">
                                                <div className="group grid size-4 grid-cols-1">
                                                    <input
                                                        id="sendThankYouEmail"
                                                        type="checkbox"
                                                        checked={sendThankYouEmail}
                                                        onChange={(e) => setSendThankYouEmail(e.target.checked)}
                                                        className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#257180] checked:bg-[#257180] indeterminate:border-[#257180] indeterminate:bg-[#257180] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                                                    />
                                                    <svg
                                                        fill="none"
                                                        viewBox="0 0 14 14"
                                                        className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                                                    >
                                                        <path
                                                            d="M3 8L6 11L11 3.5"
                                                            strokeWidth={2}
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            className="opacity-0 group-has-checked:opacity-100"
                                                        />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="text-sm/6">
                                                <label htmlFor="sendThankYouEmail" className="font-medium text-gray-900">
                                                    Send Thank You Email?
                                                </label>
                                                <p className="text-gray-500">Send a thank you email after survey completion</p>
                                            </div>
                                        </div>
                                    </div>

                                    {sendThankYouEmail && (
                                        <>
                                            <div className="sm:col-span-3">
                                                <EmailTemplateCombobox
                                                    label="Email Template"
                                                    required
                                                    value={formData.thankYouEmail?.template || ''}
                                                    onChange={(template) => setFormData({ 
                                                        ...formData, 
                                                        thankYouEmail: template ? {
                                                            template,
                                                            sendNow: thankYouEmailTiming === 'immediate',
                                                            sendNowAfterDays: thankYouEmailTiming === 'daysAfter' ? thankYouEmailDaysAfter : undefined
                                                        } : null 
                                                    })}
                                                />
                                            </div>

                                            <div className="sm:col-span-3">
                                                <label htmlFor="thankYouEmailTiming" className="block text-sm/6 font-medium text-gray-900">
                                                    Email Timing <span className="text-red-500">*</span>
                                                </label>
                                                <div className="mt-2">
                                                    <select
                                                        id="thankYouEmailTiming"
                                                        required
                                                        value={thankYouEmailTiming}
                                                        onChange={(e) => setThankYouEmailTiming(e.target.value as 'immediate' | 'daysAfter')}
                                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                                    >
                                                        <option value="immediate">Immediately after completion</option>
                                                        <option value="daysAfter">Days after event end</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {thankYouEmailTiming === 'daysAfter' && (
                                                <div className="sm:col-span-3">
                                                    <label htmlFor="thankYouEmailDaysAfter" className="block text-sm/6 font-medium text-gray-900">
                                                        Days After Event End <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="mt-2">
                                                        <input
                                                            type="number"
                                        autoComplete="off"
                                                            id="thankYouEmailDaysAfter"
                                                            min="1"
                                                            required
                                                            value={thankYouEmailDaysAfter}
                                                            onChange={(e) => setThankYouEmailDaysAfter(parseInt(e.target.value) || 1)}
                                                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Auto-checkout Configuration */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-10 md:grid-cols-3">
                <div className="px-4 sm:px-0">
                    <h2 className="text-base/7 font-semibold text-gray-900">Auto-checkout Configuration</h2>
                    <p className="mt-1 text-sm/6 text-gray-600">
                        Automatically check out attendees after a specified time.
                    </p>
                </div>

                <div className="bg-white shadow-xs outline outline-gray-900/5 sm:rounded-xl md:col-span-2">
                    <div className="px-4 py-6 sm:p-8">
                        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="col-span-full">
                                <div className="flex gap-3">
                                    <div className="flex h-6 shrink-0 items-center">
                                        <div className="group grid size-4 grid-cols-1">
                                            <input
                                                id="enableAutoCheckOut"
                                                type="checkbox"
                                                checked={enableAutoCheckOut}
                                                onChange={(e) => setEnableAutoCheckOut(e.target.checked)}
                                                className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#257180] checked:bg-[#257180] indeterminate:border-[#257180] indeterminate:bg-[#257180] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                                            />
                                            <svg
                                                fill="none"
                                                viewBox="0 0 14 14"
                                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                                            >
                                                <path
                                                    d="M3 8L6 11L11 3.5"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="opacity-0 group-has-checked:opacity-100"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-sm/6">
                                        <label htmlFor="enableAutoCheckOut" className="font-medium text-gray-900">
                                            Enable auto-check-out?
                                        </label>
                                        <p className="text-gray-500">Automatically check out attendees after check-in</p>
                                    </div>
                                </div>
                            </div>

                            {enableAutoCheckOut && (
                                <>
                                    <div className="sm:col-span-3 sm:col-start-1">
                                        <label htmlFor="autoCheckOutMinutesAfter" className="block text-sm/6 font-medium text-gray-900">
                                            Minutes After Check-in <span className="text-red-500">*</span>
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            How many minutes after check-in to auto-check-out
                                        </p>
                                        <div className="mt-2">
                                            <input
                                                type="number"
                                        autoComplete="off"
                                                id="autoCheckOutMinutesAfter"
                                                min="1"
                                                required
                                                value={formData.autoCheckOut?.minutesAfter || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    autoCheckOut: {
                                                        minutesAfter: parseInt(e.target.value) || 30,
                                                        postEventId: formData.autoCheckOut?.postEventId || ''
                                                    }
                                                })}
                                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                            />
                                        </div>
                                    </div>

                                    <div className="sm:col-span-3">
                                        <label htmlFor="autoCheckOutPostEventId" className="block text-sm/6 font-medium text-gray-900">
                                            Post-Event Expanse ID
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">
                                            ID of the post-event survey to redirect to
                                        </p>
                                        <div className="mt-2">
                                            <input
                                                type="text"
                                        autoComplete="off"
                                                id="autoCheckOutPostEventId"
                                                value={formData.autoCheckOut?.postEventId || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    autoCheckOut: {
                                                        minutesAfter: formData.autoCheckOut?.minutesAfter || 30,
                                                        postEventId: e.target.value
                                                    }
                                                })}
                                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Check-In Display Configuration */}
            {formData.eventID !== 'new' && (
                <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-10 md:grid-cols-3">
                    <div className="px-4 sm:px-0">
                        <h2 className="text-base/7 font-semibold text-gray-900">Check-In Display Configuration</h2>
                        <p className="mt-1 text-sm/6 text-gray-600">
                            Select survey questions to display during check-in and customize their display names.
                        </p>
                    </div>

                    <div className="bg-white shadow-xs outline outline-gray-900/5 sm:rounded-xl md:col-span-2">
                        <div className="px-4 py-6 sm:p-8">
                            <div className="space-y-4">
                                {checkInDisplayMatrix.map((entry, index) => (
                                    <div key={index} className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm/6 font-medium text-gray-900">
                                                Survey Question
                                            </label>
                                            <select
                                                value={entry.questionId}
                                                onChange={(e) => handleCheckInDisplayChange(index, 'questionId', e.target.value)}
                                                className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                            >
                                                <option value="">Select a question...</option>
                                                {surveyQuestions.map(q => (
                                                    <option key={q.value} value={q.value}>{q.text}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-3">
                                            <label className="block text-sm/6 font-medium text-gray-900">
                                                Display Name
                                            </label>
                                            <input
                                                type="text"
                                        autoComplete="off"
                                                value={entry.displayName}
                                                onChange={(e) => handleCheckInDisplayChange(index, 'displayName', e.target.value)}
                                                placeholder="Custom display name"
                                                className="mt-2 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                            />
                                        </div>
                                        <div className="sm:col-span-1 flex items-end">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCheckInDisplay(index)}
                                                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddCheckInDisplay}
                                    className="rounded-md bg-[#257180] px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1a4d57]"
                                >
                                    Add Question
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Survey Response Limit */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-8 py-10 md:grid-cols-3">
                <div className="px-4 sm:px-0">
                    <h2 className="text-base/7 font-semibold text-gray-900">Survey Response Limit</h2>
                    <p className="mt-1 text-sm/6 text-gray-600">
                        Limit the number of survey responses and customize the message shown when the limit is reached.
                    </p>
                </div>

                <div className="bg-white shadow-xs outline outline-gray-900/5 sm:rounded-xl md:col-span-2">
                    <div className="px-4 py-6 sm:p-8">
                        <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="survey_count_limit" className="block text-sm/6 font-medium text-gray-900">
                                    Maximum Survey Responses
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave blank for unlimited responses
                                </p>
                                <div className="mt-2">
                                    <input
                                        type="number"
                                        autoComplete="off"
                                        id="survey_count_limit"
                                        min="0"
                                        value={formData.survey_count_limit || ''}
                                        onChange={(e) => setFormData({ ...formData, survey_count_limit: e.target.value ? parseInt(e.target.value) : null })}
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                    />
                                </div>
                            </div>

                            {formData.survey_count_limit && formData.survey_count_limit > 0 && (
                                <div className="col-span-full">
                                    <label htmlFor="limit_reached_message" className="block text-sm/6 font-medium text-gray-900">
                                        Limit Reached Message
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Message shown when the survey limit is reached (supports Markdown)
                                    </p>
                                    <div className="mt-2">
                                        <textarea
                                            id="limit_reached_message"
                                            rows={4}
                                            value={formData.limit_reached_message || ''}
                                            onChange={(e) => setFormData({ ...formData, limit_reached_message: e.target.value || null })}
                                            placeholder="Thank you for your interest. This survey has reached its response limit."
                                            className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="col-span-full">
                                <label htmlFor="thanks" className="block text-sm/6 font-medium text-gray-900">
                                    Thank You Message
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Message shown after survey completion
                                </p>
                                <div className="mt-2">
                                    <textarea
                                        id="thanks"
                                        rows={3}
                                        value={formData.thanks || ''}
                                        onChange={(e) => setFormData({ ...formData, thanks: e.target.value || null })}
                                        placeholder="Thank you for completing the survey!"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-[#257180] sm:text-sm/6"
                                    />
                                </div>
                            </div>

                            <div className="col-span-full">
                                <div className="flex gap-3">
                                    <div className="flex h-6 shrink-0 items-center">
                                        <div className="group grid size-4 grid-cols-1">
                                            <input
                                                id="showLanguageChooser"
                                                type="checkbox"
                                                checked={formData.showLanguageChooser}
                                                onChange={(e) => setFormData({ ...formData, showLanguageChooser: e.target.checked })}
                                                className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-[#257180] checked:bg-[#257180] indeterminate:border-[#257180] indeterminate:bg-[#257180] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                                            />
                                            <svg
                                                fill="none"
                                                viewBox="0 0 14 14"
                                                className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                                            >
                                                <path
                                                    d="M3 8L6 11L11 3.5"
                                                    strokeWidth={2}
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="opacity-0 group-has-checked:opacity-100"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="text-sm/6">
                                        <label htmlFor="showLanguageChooser" className="font-medium text-gray-900">
                                            Show Language Chooser
                                        </label>
                                        <p className="text-gray-500">Allow users to change the survey language</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-x-6 px-4 py-6 sm:px-8">
                <button 
                    type="button" 
                    onClick={() => navigate('/admin')}
                    className="text-sm/6 font-semibold text-gray-900"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-[#257180] px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-[#1a4d57] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
    );
}
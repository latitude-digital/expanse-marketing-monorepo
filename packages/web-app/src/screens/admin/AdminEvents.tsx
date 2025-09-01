import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { collection, query, getDocs, orderBy, Timestamp, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";
import db from '../../services/firestore';

// Import FontAwesome SVG icons as URLs
import GearIconUrl from '@fontawesome/regular/gear.svg';
import TableIconUrl from '@fontawesome/regular/table.svg';
import ArrowsDownToPeopleIconUrl from '@fontawesome/regular/arrows-down-to-people.svg';
import PersonToDoorIconUrl from '@fontawesome/regular/person-to-door.svg';
import ChevronDownIconUrl from '@fontawesome/solid/chevron-down.svg';
import ChevronUpIconUrl from '@fontawesome/solid/chevron-up.svg';
import XMarkIconUrl from '@fontawesome/regular/xmark.svg';
import BrowserIconUrl from '@fontawesome/regular/browser.svg';
import { FontAwesomeIcon } from '../../components/FontAwesomeIcon';

// Create icon components
const ChevronDownIcon = (props: any) => <FontAwesomeIcon src={ChevronDownIconUrl} {...props} />;
const ChevronUpIcon = (props: any) => <FontAwesomeIcon src={ChevronUpIconUrl} {...props} />;
const XMarkIcon = (props: any) => <FontAwesomeIcon src={XMarkIconUrl} {...props} />;

interface ExpanseEvent {
    id?: string;
    _preEventID?: string;
    fordEventID?: string;
    lincolnEventID?: string;
    name: string;
    subdomain: string;
    preRegDate?: Date;
    startDate: Date;
    endDate: Date;
    agency?: string;
    hidden?: boolean;
    archived?: boolean;
    isInternal?: boolean;
    locked?: boolean;
    template?: string;
    brand?: 'ford' | 'lincoln';
    brandConfig?: {
        ford?: boolean;
        lincoln?: boolean;
    };
    tags?: string[];
    surveyType?: string;
}

const EventConverter: FirestoreDataConverter<ExpanseEvent> = {
    toFirestore(event: ExpanseEvent): DocumentData {
        return {
            ...event,
            preRegDate: event.preRegDate ? Timestamp.fromDate(event.preRegDate) : undefined,
            startDate: Timestamp.fromDate(event.startDate),
            endDate: Timestamp.fromDate(event.endDate),
        };
    },
    fromFirestore(
        snapshot: QueryDocumentSnapshot,
        options: SnapshotOptions
    ): ExpanseEvent {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            _preEventID: data._preEventID,
            fordEventID: data.fordEventID,
            lincolnEventID: data.lincolnEventID,
            name: data.name || '',
            subdomain: data.subdomain || '',
            preRegDate: data.preRegDate ? data.preRegDate.toDate() : undefined,
            startDate: data.startDate ? data.startDate.toDate() : new Date(),
            endDate: data.endDate ? data.endDate.toDate() : new Date(),
            agency: data.agency,
            hidden: data.hidden || false,
            archived: data.archived || false,
            isInternal: data.isInternal || false,
            locked: data.locked || false,
            template: data.template,
            brand: data.brand,
            brandConfig: data.brandConfig || { ford: false, lincoln: false },
            tags: data.tags || [],
            surveyType: data.surveyType,
        };
    }
};

type SortField = 'name' | 'startDate' | 'endDate' | 'brand';
type SortDirection = 'asc' | 'desc';

export default function AdminEvents() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<ExpanseEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortField, setSortField] = useState<SortField>('startDate');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'current' | 'past' | 'future'>('current');

    useEffect(() => {
        loadEvents();
    }, []);

    // Adjust sort order when tab changes
    useEffect(() => {
        if (activeTab === 'past') {
            setSortDirection('desc');
        } else {
            setSortDirection('asc');
        }
    }, [activeTab]);

    const loadEvents = async () => {
        try {
            const eventsQuery = query(
                collection(db, 'events').withConverter(EventConverter),
                orderBy('startDate', 'desc')
            );
            const snapshot = await getDocs(eventsQuery);
            const eventsData = snapshot.docs.map(doc => doc.data());
            setEvents(eventsData);
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filter events based on search term
    const searchedEvents = events.filter(event => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            event.name?.toLowerCase().includes(searchLower) ||
            event.subdomain?.toLowerCase().includes(searchLower) ||
            event.agency?.toLowerCase().includes(searchLower) ||
            event.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
            event.fordEventID?.toLowerCase().includes(searchLower) ||
            event.lincolnEventID?.toLowerCase().includes(searchLower)
        );
    });

    // Filter events based on active tab (current/past/future)
    const filteredEvents = searchedEvents.filter(event => {
        const now = new Date();
        const nowTime = now.getTime();
        const startTime = event.startDate.getTime();
        const endTime = event.endDate.getTime();

        switch (activeTab) {
            case 'past':
                return endTime < nowTime;
            case 'future':
                return startTime > nowTime;
            case 'current':
            default:
                return startTime <= nowTime && endTime >= nowTime;
        }
    });

    const sortedEvents = [...filteredEvents].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
            case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
            case 'startDate':
                aValue = a.startDate.getTime();
                bValue = b.startDate.getTime();
                break;
            case 'endDate':
                aValue = a.endDate.getTime();
                bValue = b.endDate.getTime();
                break;
            case 'brand':
                aValue = a.brandConfig?.ford ? 'ford' : a.brandConfig?.lincoln ? 'lincoln' : 'none';
                bValue = b.brandConfig?.ford ? 'ford' : b.brandConfig?.lincoln ? 'lincoln' : 'none';
                break;
            default:
                return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const getBrandDisplay = (event: ExpanseEvent) => {
        const brands = [];
        if (event.brandConfig?.ford) brands.push('Ford');
        if (event.brandConfig?.lincoln) brands.push('Lincoln');
        if (brands.length === 0) {
            if (event.brand === 'ford') return 'Ford';
            if (event.brand === 'lincoln') return 'Lincoln';
            return 'None';
        }
        return brands.join(', ');
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading events...</div>;
    }

    const tabs = [
        { name: 'Current', value: 'current' as const, count: events.filter(e => {
            const now = Date.now();
            return e.startDate.getTime() <= now && e.endDate.getTime() >= now;
        }).length },
        { name: 'Past', value: 'past' as const, count: events.filter(e => e.endDate.getTime() < Date.now()).length },
        { name: 'Future', value: 'future' as const, count: events.filter(e => e.startDate.getTime() > Date.now()).length },
    ];

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ');
    }

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        onClick={() => navigate('/admin/event/new')}
                        className="block rounded-md bg-[#257180] px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-[#1a4d57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#257180]"
                    >
                        Create Event
                    </button>
                </div>
            </div>

            {/* Search Bar and Tabs - stacked on mobile, side by side on sm and up */}
            <div className="mt-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                {/* Search Bar */}
                <div className="relative sm:flex-1">
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-0 py-2 pl-4 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#257180] sm:text-sm sm:leading-6"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="sm:flex-shrink-0">
                    <div className="relative sm:hidden">
                        <select
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value as 'current' | 'past' | 'future')}
                            aria-label="Select a tab"
                            className="w-full rounded-md border-gray-300 bg-white py-2 pr-10 pl-3 text-base text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#257180] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            style={{ 
                                WebkitAppearance: 'none', 
                                MozAppearance: 'none',
                                appearance: 'none',
                                backgroundImage: 'none'
                            }}
                        >
                            {tabs.map((tab) => (
                                <option key={tab.value} value={tab.value}>
                                    {tab.name} ({tab.count})
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <nav aria-label="Tabs" className="flex space-x-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => setActiveTab(tab.value)}
                                    aria-current={tab.value === activeTab ? 'page' : undefined}
                                    className={classNames(
                                        tab.value === activeTab
                                            ? 'bg-[#257180]/10 text-[#257180]'
                                            : 'text-gray-500 hover:text-gray-700',
                                        'rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap'
                                    )}
                                >
                                    {tab.name}
                                    {tab.count > 0 && (
                                        <span className="ml-2 text-xs">
                                            ({tab.count})
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Tab description */}
            <div className="mt-4 text-sm text-gray-600">
                {activeTab === 'current' && 'Showing events that are currently active (today is between start and end date)'}
                {activeTab === 'past' && 'Showing events that have already ended'}
                {activeTab === 'future' && 'Showing events that have not yet started'}
            </div>
            
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                        <button
                                            onClick={() => handleSort('name')}
                                            className="group inline-flex items-center"
                                        >
                                            Event Name
                                            <span className="ml-2 flex-none rounded">
                                                {sortField === 'name' ? (
                                                    sortDirection === 'asc' ? (
                                                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                                    )
                                                ) : (
                                                    <ChevronDownIcon className="invisible h-5 w-5 text-gray-400 group-hover:visible" />
                                                )}
                                            </span>
                                        </button>
                                    </th>
                                    <th scope="col" className="hidden xl:table-cell w-1/4 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Tags
                                    </th>
                                    <th scope="col" className="hidden xl:table-cell w-24 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        <button
                                            onClick={() => handleSort('brand')}
                                            className="group inline-flex items-center"
                                        >
                                            Brand
                                            <span className="ml-2 flex-none rounded">
                                                {sortField === 'brand' ? (
                                                    sortDirection === 'asc' ? (
                                                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                                    )
                                                ) : (
                                                    <ChevronDownIcon className="invisible h-5 w-5 text-gray-400 group-hover:visible" />
                                                )}
                                            </span>
                                        </button>
                                    </th>
                                    <th scope="col" className="w-28 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        <button
                                            onClick={() => handleSort('startDate')}
                                            className="group inline-flex items-center"
                                        >
                                            Start Date
                                            <span className="ml-2 flex-none rounded">
                                                {sortField === 'startDate' ? (
                                                    sortDirection === 'asc' ? (
                                                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                                    )
                                                ) : (
                                                    <ChevronDownIcon className="invisible h-5 w-5 text-gray-400 group-hover:visible" />
                                                )}
                                            </span>
                                        </button>
                                    </th>
                                    <th scope="col" className="hidden lg:table-cell w-28 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        <button
                                            onClick={() => handleSort('endDate')}
                                            className="group inline-flex items-center"
                                        >
                                            End Date
                                            <span className="ml-2 flex-none rounded">
                                                {sortField === 'endDate' ? (
                                                    sortDirection === 'asc' ? (
                                                        <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                                                    ) : (
                                                        <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                                                    )
                                                ) : (
                                                    <ChevronDownIcon className="invisible h-5 w-5 text-gray-400 group-hover:visible" />
                                                )}
                                            </span>
                                        </button>
                                    </th>
                                    <th scope="col" className="relative w-48 py-3.5 pl-3 pr-4 sm:pr-0">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sortedEvents.map((event) => (
                                    <tr key={event.id}>
                                        <td className="py-4 pl-4 pr-3 text-sm sm:pl-0">
                                            <button
                                                onClick={() => navigate(`/admin/event/${event.id}`)}
                                                className="font-medium text-[#257180] hover:text-[#1a4d57] text-left"
                                            >
                                                {event.name}
                                            </button>
                                        </td>
                                        <td className="hidden xl:table-cell w-1/4 px-3 py-4 text-sm text-gray-500">
                                            {event.tags && event.tags.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {event.tags.map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="hidden xl:table-cell w-24 whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {getBrandDisplay(event)}
                                        </td>
                                        <td className="w-28 whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {event.startDate.toLocaleDateString()}
                                        </td>
                                        <td className="hidden lg:table-cell w-28 whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {event.endDate.toLocaleDateString()}
                                        </td>
                                        <td className="relative w-48 whitespace-nowrap py-3 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                            <div className="flex gap-1 justify-end">
                                                <button
                                                    onClick={() => navigate(`/admin/event/${event.id}`)}
                                                    className="bg-[#257180] hover:bg-[#1a4d57] text-white rounded inline-flex items-center justify-center flex-shrink-0"
                                                    style={{ width: '36px', height: '36px' }}
                                                    title="Edit Event"
                                                >
                                                    <img src={GearIconUrl} className="h-4 w-4 filter brightness-0 invert" alt="Edit" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/admin/survey/${event.id}`)}
                                                    className="bg-[#257180] hover:bg-[#1a4d57] text-white rounded inline-flex items-center justify-center flex-shrink-0"
                                                    style={{ width: '36px', height: '36px' }}
                                                    title="Edit Survey"
                                                >
                                                    <img src={TableIconUrl} className="h-4 w-4 filter brightness-0 invert" alt="Survey" />
                                                </button>
                                                {(event.preRegDate || event.surveyType === 'preTD') && (
                                                    <button
                                                        onClick={() => navigate(`/s/${event.subdomain || event.id}/in`)}
                                                        className="bg-[#257180] hover:bg-[#1a4d57] text-white rounded inline-flex items-center justify-center flex-shrink-0"
                                                        style={{ width: '36px', height: '36px' }}
                                                        title="Check In"
                                                    >
                                                        <img src={ArrowsDownToPeopleIconUrl} className="h-4 w-4 filter brightness-0 invert" alt="Check In" />
                                                    </button>
                                                )}
                                                {event._preEventID && (
                                                    <button
                                                        onClick={() => navigate(`/s/${event.subdomain || event.id}/out`)}
                                                        className="bg-[#257180] hover:bg-[#1a4d57] text-white rounded inline-flex items-center justify-center flex-shrink-0"
                                                        style={{ width: '36px', height: '36px' }}
                                                        title="Check Out"
                                                    >
                                                        <img src={PersonToDoorIconUrl} className="h-4 w-4 filter brightness-0 invert" alt="Check Out" />
                                                    </button>
                                                )}
                                                {(() => {
                                                    const now = Date.now();
                                                    const isCurrent = event.startDate.getTime() <= now && event.endDate.getTime() >= now;
                                                    return isCurrent ? (
                                                        <button
                                                            onClick={() => window.open(`/s/${event.subdomain || event.id}`, '_blank')}
                                                            className="bg-[#257180] hover:bg-[#1a4d57] text-white rounded inline-flex items-center justify-center flex-shrink-0"
                                                            style={{ width: '36px', height: '36px' }}
                                                            title="Open Survey"
                                                        >
                                                            <img src={BrowserIconUrl} className="h-4 w-4 filter brightness-0 invert" alt="Open Survey" />
                                                        </button>
                                                    ) : null;
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {sortedEvents.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-sm text-gray-500">No events yet. Create your first event to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
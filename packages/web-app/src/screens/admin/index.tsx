import { useEffect, useState } from 'react';

import { useNavigate, useParams } from "react-router-dom";
import { getFirestore, doc, getDoc, collection, query, getDocs, where, orderBy, Query, Timestamp, FirestoreDataConverter, DocumentData, QueryDocumentSnapshot, SnapshotOptions } from "firebase/firestore";
import { useAuthState } from 'react-firebase-hooks/auth';

import auth from '../../services/auth';
import app from '../../services/firebase';

import { Model, Question, slk, SurveyModel, ITheme } from "survey-core";
import { SurveyCreator } from "survey-creator-react";

import 'survey-analytics/survey.analytics.min.css';
import 'survey-creator-core/survey-creator-core.min.css';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridApi, GridReadyEvent, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
// Import AG Grid CSS
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import './admin.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

slk(
    "NDBhNThlYzYtN2EwMy00ZTgxLWIyNGQtOGFkZWJkM2NlNjI3OzE9MjAyNS0wNy0xOSwyPTIwMjUtMDctMTksND0yMDI1LTA3LTE5"
);

const EEventConverter: FirestoreDataConverter<ExpanseEvent> = {
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
            checkInDisplay: data.checkInDisplay,
            confirmationEmail: data.confirmationEmail,
            disabled: data.disabled,
            preRegDate: data.preRegDate?.toDate(),
            startDate: data.startDate?.toDate(),
            endDate: data.endDate?.toDate(),
            name: data.name,
            questions: data.questions,
            reminderEmail: data.reminderEmail,
            thankYouEmail: data.thankYouEmail,
            thanks: data.thanks,
            theme: data.theme,
        };
    },
};


function AdminScreen() {
    const navigate = useNavigate();
    const [user, userLoading, userError] = useAuthState(auth);
    const [eventsQuery, setEventsQuery] = useState<Query<DocumentData, DocumentData>>();
    const [events, eventsLoading, eventsError] = useCollectionData<ExpanseEvent>(eventsQuery as any);
    const [gridApi, setGridApi] = useState<GridApi | null>(null);
    const [quickFilterText, setQuickFilterText] = useState<string>('');
    const [activeFilter, setActiveFilter] = useState<'current' | 'past' | 'future'>('current');

    useEffect(() => {
        console.error(userError);
    }, [userError]);

    const db = getFirestore(app);

    useEffect(() => {
        if (userLoading) return;

        if (!user) {
            navigate('./login');
        }

        // Load all events - we'll filter client-side
        const eventsCollection = collection(db, "events").withConverter(EEventConverter);
        const eventQuery = query(eventsCollection, orderBy("startDate", "asc"));
        
        setEventsQuery(eventQuery);
    }, [userLoading]);

    // Define external filter function
    const isExternalFilterPresent = () => {
        return activeFilter !== null;
    };

    const doesExternalFilterPass = (node: any) => {
        if (!node.data) return true;
        
        const now = new Date();
        const nowTime = now.getTime();
        
        const startDate = node.data.startDate ? new Date(node.data.startDate) : null;
        const endDate = node.data.endDate ? new Date(node.data.endDate) : null;
        
        switch (activeFilter) {
            case 'past':
                // Past events: end date is before now
                return endDate && endDate.getTime() < nowTime;
                
            case 'future':
                // Future events: start date is after now
                return startDate && startDate.getTime() > nowTime;
                
            case 'current':
            default:
                // Current events: now is between start and end date
                return startDate && endDate && 
                       startDate.getTime() <= nowTime && 
                       endDate.getTime() >= nowTime;
        }
    };

    // Apply filters when data loads or filter changes
    useEffect(() => {
        if (!gridApi || !events) return;

        gridApi.onFilterChanged();
        
        // Apply sort based on filter type
        if (activeFilter === 'past') {
            gridApi.applyColumnState({
                state: [
                    { colId: 'startDate', sort: 'desc' }
                ],
                defaultState: { sort: null }
            });
        } else {
            gridApi.applyColumnState({
                state: [
                    { colId: 'startDate', sort: 'asc' }
                ],
                defaultState: { sort: null }
            });
        }
        
        // Reset row heights after filtering
        setTimeout(() => {
            gridApi.resetRowHeights();
            gridApi.onRowHeightChanged();
        }, 100);
    }, [gridApi, events, activeFilter]);

    // Define column definitions
    const columnDefs: ColDef[] = [
        {
            headerName: '',
            field: 'actions',
            width: 70,
            sortable: false,
            filter: false,
            resizable: false,
            pinned: 'left',
            autoHeight: true,
            cellRenderer: (params: any) => {
                const hasCheckIn = params.data.preRegDate || params.data.confirmationEmail || params.data.reminderEmail;
                const hasCheckOut = params.data._preEventID;
                
                return (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '4px', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '12px 4px',
                        width: '100%'
                    }}>
                        {hasCheckIn && (
                            <a
                                href={`/s/${encodeURIComponent(params.data.id)}/in`}
                                data-testid={`admin-dashboard-table-checkin-link-${params.data.id}`}
                                style={{
                                    padding: '6px 10px',
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '3px',
                                    fontSize: '12px',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    minHeight: '32px'
                                }}
                            >
                                <span style={{ fontSize: '14px' }}>✓</span> In
                            </a>
                        )}
                        {hasCheckOut && (
                            <a
                                href={`/s/${encodeURIComponent(params.data.id)}/out`}
                                data-testid={`admin-dashboard-table-checkout-link-${params.data.id}`}
                                style={{
                                    padding: '6px 10px',
                                    backgroundColor: '#FF9800',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '3px',
                                    fontSize: '12px',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    minHeight: '32px'
                                }}
                            >
                                <span style={{ fontSize: '14px' }}>✓</span> Out
                            </a>
                        )}
                    </div>
                );
            }
        },
        { 
            field: 'name', 
            headerName: 'Event Name',
            minWidth: 140,
            maxWidth: 300,
            pinned: 'left',
            wrapText: true,
            autoHeight: true,
            cellStyle: {
                whiteSpace: 'normal',
                lineHeight: '1.4',
                padding: '12px 8px'
            },
            cellRenderer: (params: any) => {
                return (
                    <a 
                        href={`/admin/event/${encodeURIComponent(params.data.id)}`}
                        data-testid={`admin-dashboard-table-event-name-link-${params.data.id}`}
                        style={{ 
                            color: '#1976d2', 
                            textDecoration: 'none', 
                            display: 'block',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word'
                        }}
                        title={params.value}
                    >
                        {params.value}
                    </a>
                );
            }
        },
        { 
            field: 'startDate', 
            headerName: 'Start Date',
            minWidth: 120,
            flex: 1,
            sort: 'asc', // Default sort ascending
            filter: 'agDateColumnFilter',
            filterParams: {
                comparator: (filterLocalDateAtMidnight: Date, cellValue: any) => {
                    if (!cellValue) return 0;
                    const cellDate = new Date(cellValue);
                    cellDate.setHours(0, 0, 0, 0);
                    if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                        return 0;
                    }
                    if (cellDate < filterLocalDateAtMidnight) {
                        return -1;
                    }
                    if (cellDate > filterLocalDateAtMidnight) {
                        return 1;
                    }
                    return 0;
                },
            },
            cellStyle: {
                padding: '12px 8px'
            },
            cellRenderer: (params: any) => {
                const date = params.data?.startDate;
                if (date) {
                    return (
                        <span>
                            {date.toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                    );
                }
                return <span></span>;
            },
            comparator: (valueA, valueB) => {
                const dateA = valueA ? valueA.getTime() : 0;
                const dateB = valueB ? valueB.getTime() : 0;
                return dateA - dateB;
            }
        },
        { 
            field: 'endDate', 
            headerName: 'End Date',
            minWidth: 120,
            flex: 1,
            filter: 'agDateColumnFilter',
            filterParams: {
                comparator: (filterLocalDateAtMidnight: Date, cellValue: any) => {
                    if (!cellValue) return 0;
                    const cellDate = new Date(cellValue);
                    cellDate.setHours(0, 0, 0, 0);
                    if (filterLocalDateAtMidnight.getTime() === cellDate.getTime()) {
                        return 0;
                    }
                    if (cellDate < filterLocalDateAtMidnight) {
                        return -1;
                    }
                    if (cellDate > filterLocalDateAtMidnight) {
                        return 1;
                    }
                    return 0;
                },
            },
            cellStyle: {
                padding: '12px 8px'
            },
            cellRenderer: (params: any) => {
                const date = params.data?.endDate;
                if (date) {
                    return (
                        <span>
                            {date.toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </span>
                    );
                }
                return <span></span>;
            },
            comparator: (valueA, valueB) => {
                const dateA = valueA ? valueA.getTime() : 0;
                const dateB = valueB ? valueB.getTime() : 0;
                return dateA - dateB;
            }
        },
        { 
            field: 'id', 
            headerName: 'Event ID',
            minWidth: 150,
            flex: 1.2,
            wrapText: true,
            autoHeight: true,
            cellStyle: {
                whiteSpace: 'normal',
                lineHeight: '1.4',
                padding: '12px 8px'
            },
            cellRenderer: (params: any) => {
                return (
                    <a 
                        href={`/s/${encodeURIComponent(params.value)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`admin-dashboard-table-event-id-link-${params.value}`}
                        style={{ 
                            color: '#1976d2', 
                            textDecoration: 'none',
                            display: 'block',
                            whiteSpace: 'normal',
                            wordBreak: 'break-all'
                        }}
                        title={params.value}
                    >
                        {params.value}
                    </a>
                );
            }
        },
        {
            field: 'emails',
            headerName: 'Emails',
            width: 120,
            sortable: false,
            autoHeight: true,
            cellRenderer: (params: any) => {
                const chips = [];
                
                if (params.data.confirmationEmail) {
                    chips.push({ label: 'Conf', color: '#2196F3' });
                }
                if (params.data.reminderEmail) {
                    chips.push({ label: 'Remind', color: '#9C27B0' });
                }
                if (params.data.thankYouEmail) {
                    chips.push({ label: 'Thanks', color: '#4CAF50' });
                }
                if (params.data.checkOutEmail) {
                    chips.push({ label: 'Out', color: '#FF9800' });
                }
                
                return (
                    <div style={{ 
                        display: 'flex', 
                        gap: '4px', 
                        flexWrap: 'wrap', 
                        alignItems: 'center',
                        padding: '12px 8px'
                    }}>
                        {chips.map((chip, index) => (
                            <span
                                key={index}
                                style={{
                                    padding: '2px 8px',
                                    backgroundColor: chip.color,
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-block',
                                    lineHeight: 'normal'
                                }}
                            >
                                {chip.label}
                            </span>
                        ))}
                    </div>
                );
            }
        },
        { 
            field: 'fordLincolnEventID', 
            headerName: 'Ford/Lincoln Event ID',
            minWidth: 100,
            flex: 0.8,
            wrapHeaderText: true,
            cellStyle: {
                padding: '12px 8px'
            },
            valueGetter: (params) => {
                // Check for fordEventID or lincolnEventID
                return params.data.fordEventID || params.data.lincolnEventID || '';
            },
            valueFormatter: (params) => {
                if (params.value) {
                    return String(params.value);
                }
                return '';
            }
        }
    ];

    // Grid Ready Event Handler
    const onGridReady = (params: GridReadyEvent) => {
        setGridApi(params.api);
        // Ensure rows are sized correctly after grid is ready
        setTimeout(() => {
            params.api.resetRowHeights();
            params.api.onRowHeightChanged();
        }, 100);
    };

    return (
        <div className="admin-grid-container" data-testid="admin-dashboard-container">
            <div style={{ padding: '20px', flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', gap: '20px' }}>
                    <h1 style={{ margin: 0 }} data-testid="admin-dashboard-header-title">Events</h1>
                    <a 
                        href="/admin/event/new"
                        data-testid="admin-dashboard-header-new-event-button"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            display: 'inline-block'
                        }}
                    >
                        New Event
                    </a>
                </div>

                {/* Search and Filter Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    {/* Quick Filter Search Box */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 auto', minWidth: '300px' }}>
                        <input
                            type="text"
                            placeholder="Search across all columns..."
                            value={quickFilterText}
                            onChange={(e) => setQuickFilterText(e.target.value)}
                            data-testid="admin-dashboard-search-input"
                            style={{
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                flex: 1
                            }}
                        />
                        {quickFilterText && (
                            <button
                                onClick={() => setQuickFilterText('')}
                                data-testid="admin-dashboard-search-clear-button"
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Filter Buttons */}
                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                        <button
                            onClick={() => setActiveFilter('current')}
                            data-testid="admin-dashboard-filters-current-events-button"
                            style={{
                                padding: '8px 16px',
                                backgroundColor: activeFilter === 'current' ? '#1976d2' : '#e0e0e0',
                                color: activeFilter === 'current' ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: activeFilter === 'current' ? 'bold' : 'normal',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Current Events
                        </button>
                        <button
                            onClick={() => setActiveFilter('past')}
                            data-testid="admin-dashboard-filters-past-events-button"
                            style={{
                                padding: '8px 16px',
                                backgroundColor: activeFilter === 'past' ? '#1976d2' : '#e0e0e0',
                                color: activeFilter === 'past' ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: activeFilter === 'past' ? 'bold' : 'normal',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Past Events
                        </button>
                        <button
                            onClick={() => setActiveFilter('future')}
                            data-testid="admin-dashboard-filters-future-events-button"
                            style={{
                                padding: '8px 16px',
                                backgroundColor: activeFilter === 'future' ? '#1976d2' : '#e0e0e0',
                                color: activeFilter === 'future' ? 'white' : '#333',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: activeFilter === 'future' ? 'bold' : 'normal',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            Future Events
                        </button>
                    </div>
                </div>
                
                <div style={{ fontSize: '14px', color: '#666' }}>
                    {activeFilter === 'current' && 'Showing events that are currently active (today is between start and end date)'}
                    {activeFilter === 'past' && 'Showing events that have already ended'}
                    {activeFilter === 'future' && 'Showing events that have not yet started'}
                </div>
            </div>

            {eventsLoading && (
                <div style={{ padding: '20px', textAlign: 'center' }} data-testid="admin-dashboard-loading">
                    <p>Loading events...</p>
                </div>
            )}

            {eventsError && (
                <div style={{ padding: '20px', color: 'red' }} data-testid="admin-dashboard-error">
                    <p>Error loading events: {eventsError.message}</p>
                </div>
            )}

            {/* AG Grid */}
            {!eventsLoading && !eventsError && (
                <div className="ag-theme-material" data-testid="admin-dashboard-table" style={{ 
                    width: 'calc(100% - 40px)', 
                    margin: '0 20px 20px', 
                    boxSizing: 'border-box',
                    overflow: 'auto',
                    flex: 1
                }}>
                    <AgGridReact
                        rowData={events || []}
                        columnDefs={columnDefs}
                        quickFilterText={quickFilterText}
                        theme="legacy"
                        defaultColDef={{
                            sortable: true,
                            filter: true,
                            resizable: true,
                            floatingFilter: true,
                            menuTabs: ['filterMenuTab', 'generalMenuTab', 'columnsMenuTab'],
                            headerComponentParams: {
                                menuIcon: 'fa-bars'
                            }
                        }}
                        onGridReady={onGridReady}
                        pagination={true}
                        paginationPageSize={50}
                        paginationPageSizeSelector={[20, 50, 100, 200]}
                        animateRows={true}
                        enableCellTextSelection={true}
                        alwaysShowHorizontalScroll={true}
                        alwaysShowVerticalScroll={false}
                        ensureDomOrder={true}
                        rowSelection='multiple'
                        suppressMenuHide={true}
                        headerHeight={56}
                        domLayout='autoHeight'
                        suppressRowTransform={true}
                        onRowDataUpdated={(params) => {
                            setTimeout(() => {
                                params.api.resetRowHeights();
                                params.api.onRowHeightChanged();
                            }, 100);
                        }}
                        onModelUpdated={(params) => {
                            setTimeout(() => {
                                params.api.resetRowHeights();
                                params.api.onRowHeightChanged();
                            }, 100);
                        }}
                        isExternalFilterPresent={isExternalFilterPresent as any}
                        doesExternalFilterPass={doesExternalFilterPass as any}
                        getRowHeight={(params) => {
                            // Calculate row height based on content
                            return undefined; // Let AG Grid calculate automatically
                        }}
                        statusBar={{
                            statusPanels: [
                                { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
                                { statusPanel: 'agTotalRowCountComponent', align: 'center' },
                                { statusPanel: 'agFilteredRowCountComponent', align: 'right' }
                            ]
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default AdminScreen;

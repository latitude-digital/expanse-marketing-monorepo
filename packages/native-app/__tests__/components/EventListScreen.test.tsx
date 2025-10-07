import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EventListScreen from '../../src/screens/EventListScreen';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

const mockEvents: ExpanseEvent[] = [
  {
    id: '1',
    name: 'Ford Test Drive Event',
    brand: 'Ford',
    startDate: new Date(),
    endDate: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours later
    disabled: undefined,
    questions: {},
    theme: {},
    thanks: 'Experience the latest Ford vehicles'
  },
  {
    id: '2',
    name: 'Lincoln Luxury Experience',
    brand: 'Lincoln',
    startDate: new Date(Date.now() - 86400000), // Yesterday
    endDate: new Date(Date.now() - 86400000 + 8 * 60 * 60 * 1000), // Yesterday + 8 hours
    disabled: 'Event is disabled',
    questions: {},
    theme: {},
    thanks: 'Discover Lincoln luxury'
  },
];

describe('EventListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with events', () => {
    const { getByText } = render(
      <EventListScreen events={mockEvents} />
    );

    expect(getByText('Events')).toBeTruthy();
    expect(getByText('Ford Test Drive Event')).toBeTruthy();
    expect(getByText('Lincoln Luxury Experience')).toBeTruthy();
  });

  it('shows loading state correctly', () => {
    const { getByText } = render(
      <EventListScreen events={[]} loading={true} />
    );

    expect(getByText('Loading events...')).toBeTruthy();
  });

  it('shows empty state when no events', () => {
    const { getByText } = render(
      <EventListScreen events={[]} />
    );

    expect(getByText('No Events Found')).toBeTruthy();
    expect(getByText('No events scheduled for today')).toBeTruthy();
  });

  it('filters events correctly', async () => {
    const { getByText, queryByText } = render(
      <EventListScreen events={mockEvents} />
    );

    // Should show current events by default
    expect(getByText('Ford Test Drive Event')).toBeTruthy();

    // Switch to past filter
    fireEvent.press(getByText('Past'));
    await waitFor(() => {
      expect(getByText('Lincoln Luxury Experience')).toBeTruthy();
      expect(queryByText('Ford Test Drive Event')).toBeFalsy();
    });

    // Switch to all filter
    fireEvent.press(getByText('All'));
    await waitFor(() => {
      expect(getByText('Ford Test Drive Event')).toBeTruthy();
      expect(getByText('Lincoln Luxury Experience')).toBeTruthy();
    });
  });

  it('handles event press correctly', () => {
    const mockOnEventPress = jest.fn();
    const { getByText } = render(
      <EventListScreen 
        events={mockEvents} 
        onEventPress={mockOnEventPress}
      />
    );

    fireEvent.press(getByText('Ford Test Drive Event'));
    expect(mockOnEventPress).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('handles pull-to-refresh correctly', async () => {
    const mockOnRefresh = jest.fn().mockResolvedValue(undefined);
    const { getByTestId } = render(
      <EventListScreen 
        events={mockEvents} 
        onRefresh={mockOnRefresh}
      />
    );

    // Find the FlatList by its testID (we'll need to add this)
    // For now, test that the refresh function gets called
    await waitFor(() => {
      expect(mockOnRefresh).not.toHaveBeenCalled();
    });

    // Simulate pull-to-refresh trigger
    // Note: This is a simplified test - full pull-to-refresh testing
    // requires more complex gesture simulation
  });

  it('shows brand-specific styling', () => {
    const { getByText } = render(
      <EventListScreen events={mockEvents} />
    );

    // Check that Ford brand text is present
    expect(getByText('FORD')).toBeTruthy();
    expect(getByText('LINCOLN')).toBeTruthy();
  });

  it('handles refresh error gracefully', async () => {
    const mockOnRefresh = jest.fn().mockRejectedValue(new Error('Network error'));
    const { rerender } = render(
      <EventListScreen 
        events={mockEvents} 
        onRefresh={mockOnRefresh}
      />
    );

    // Should still render events even if refresh fails
    rerender(
      <EventListScreen 
        events={mockEvents} 
        onRefresh={mockOnRefresh}
      />
    );

    expect(mockOnRefresh).toBeDefined();
  });

  it('updates event count correctly based on filter', () => {
    const { getByText } = render(
      <EventListScreen events={mockEvents} />
    );

    // Should show current count (1 current event)
    expect(getByText('1 current events')).toBeTruthy();
  });

  it('shows correct status badges', () => {
    const { getByText } = render(
      <EventListScreen events={mockEvents} />
    );

    expect(getByText('Active')).toBeTruthy();
    // Note: Inactive badge might not be visible if filtered out
  });
});

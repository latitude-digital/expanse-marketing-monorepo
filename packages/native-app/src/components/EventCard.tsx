import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { ExpanseEvent, Brand } from '@expanse/shared/types';

interface EventCardProps {
  event: ExpanseEvent;
  onPress?: (event: ExpanseEvent) => void;
  style?: object;
}

const EventCard: React.FC<EventCardProps> = ({ event, onPress, style }) => {
  const getBrandColor = (brand?: Brand): string => {
    switch (brand?.toLowerCase()) {
      case 'ford': return '#0066CC';
      case 'lincoln': return '#8B1538';
      default: return '#333333';
    }
  };

  const getBrandSecondaryColor = (brand?: Brand): string => {
    switch (brand?.toLowerCase()) {
      case 'ford': return '#e3f2fd';
      case 'lincoln': return '#fce4ec';
      default: return '#f8f9fa';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handlePress = () => {
    if (onPress) {
      onPress(event);
    }
  };

  const brandColor = getBrandColor(event.brand);
  const brandSecondaryColor = getBrandSecondaryColor(event.brand);

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: brandColor, backgroundColor: '#ffffff' }, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Brand Header */}
      <View style={[styles.brandHeader, { backgroundColor: brandSecondaryColor }]}>
        <Text style={[styles.brandText, { color: brandColor }]}>
          {(event.brand || 'Other').toUpperCase()}
        </Text>
        <View style={[styles.statusBadge, 
          !event.disabled ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={[styles.statusText,
            !event.disabled ? styles.activeStatusText : styles.inactiveStatusText
          ]}>
            {!event.disabled ? 'Active' : 'Disabled'}
          </Text>
        </View>
      </View>

      {/* Event Content */}
      <View style={styles.content}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.name || 'Unnamed Event'}
        </Text>

        {event.thanks && (
          <Text style={styles.eventDescription} numberOfLines={3}>
            {event.thanks}
          </Text>
        )}

        {/* Date and Time */}
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTime}>
            <Text style={styles.dateLabel}>Date</Text>
            <Text style={styles.dateValue}>{formatDate(event.startDate.toISOString())}</Text>
          </View>
          <View style={styles.dateTime}>
            <Text style={styles.dateLabel}>Time</Text>
            <Text style={styles.dateValue}>{formatTime(event.startDate.toISOString())}</Text>
          </View>
        </View>

        {/* Location - Not available in current interface */}

        {/* Survey Info */}
        <View style={styles.surveyInfo}>
          <View style={styles.surveyItem}>
            <Text style={styles.surveyLabel}>Survey</Text>
            <Text style={styles.surveyValue}>
              {event.name || 'Default Survey'}
            </Text>
          </View>
          
          {event.survey_count_limit && (
            <View style={styles.surveyItem}>
              <Text style={styles.surveyLabel}>Limit</Text>
              <Text style={styles.surveyValue}>
                {event.survey_count_limit} responses
              </Text>
            </View>
          )}
        </View>

        {/* Action Indicator */}
        <View style={styles.actionContainer}>
          <Text style={[styles.actionText, { color: brandColor }]}>
            Tap to view details →
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderLeftWidth: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  brandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  brandText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#d4edda',
  },
  inactiveBadge: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeStatusText: {
    color: '#155724',
  },
  inactiveStatusText: {
    color: '#721c24',
  },
  content: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    lineHeight: 24,
  },
  eventDescription: {
    fontSize: 15,
    color: '#495057',
    marginBottom: 16,
    lineHeight: 22,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dateTime: {
    flex: 1,
    marginRight: 16,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  locationContainer: {
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  surveyInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  surveyItem: {
    flex: 1,
    marginRight: 16,
  },
  surveyLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  surveyValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  actionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EventCard;
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import SurveyScreen from '../../src/screens/SurveyScreen';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';
import Toast from '../../src/components/Toast';
import { badgeScanService } from '../../src/services/badge-scan-service';

export default function SurveyPage() {
  const { id, eventData, scanValue, scanTime } = useLocalSearchParams<{
    id: string;
    eventData?: string;
    scanValue?: string;
    scanTime?: string;
  }>();

  const [prefillAnswers, setPrefillAnswers] = useState<Record<string, any> | null>(null);
  const [scanMetadata, setScanMetadata] = useState<{ value: string; time: string; response: any } | null>(null);
  const [loadingScanLookup, setLoadingScanLookup] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const event: ExpanseEvent = useMemo(() => {
    if (eventData) {
      try {
        const parsed = JSON.parse(eventData);
        return {
          id: parsed.id || id || 'unknown',
          name: parsed.name || 'Survey',
          brand: parsed.brand || 'Other',
          startDate: parsed.startDate ? new Date(parsed.startDate) : new Date(),
          endDate: parsed.endDate ? new Date(parsed.endDate) : new Date(),
          questions: parsed.questions || parsed.surveyJSON || { pages: [] },
          surveyJSON: parsed.surveyJSON,
          surveyJSModel: parsed.surveyJSModel,
          theme: parsed.theme || parsed.surveyJSTheme || { cssVariables: {} },
          surveyJSTheme: parsed.surveyJSTheme,
          customConfig: parsed.customConfig,
          showFooter: parsed.showFooter,
          showHeader: parsed.showHeader,
          showLanguageChooser: parsed.showLanguageChooser,
          surveyType: parsed.surveyType,
          tags: parsed.tags,
          thanks: parsed.thanks,
          fordEventID: parsed.fordEventID,
          lincolnEventID: parsed.lincolnEventID,
          _preEventID: parsed._preEventID,
          survey_count_limit: parsed.survey_count_limit,
          limit_reached_message: parsed.limit_reached_message,
          confirmationEmail: parsed.confirmationEmail,
          reminderEmail: parsed.reminderEmail,
          thankYouEmail: parsed.thankYouEmail,
          checkOutEmail: parsed.checkOutEmail,
          autoCheckOut: parsed.autoCheckOut,
          checkInDisplay: parsed.checkInDisplay,
        } as ExpanseEvent;
      } catch (error) {
        console.error('[SurveyPage] Failed to parse event data:', error);
      }
    }

    return {
      id: id || 'unknown',
      name: 'Survey',
      brand: 'Other',
      startDate: new Date(),
      endDate: new Date(),
      questions: { pages: [] },
      theme: { cssVariables: {} },
    };
  }, [eventData, id]);

  useEffect(() => {
    let cancelled = false;

    if (!scanValue) {
      setScanMetadata(null);
      setPrefillAnswers(null);
      return () => {
        cancelled = true;
      };
    }

    const resolvedScanTime = scanTime || new Date().toISOString();

    const assignMetadata = (response: any) => {
      if (!cancelled) {
        setScanMetadata({
          value: scanValue,
          time: resolvedScanTime,
          response,
        });
      }
    };

    if (!event.customConfig?.badgeScan) {
      assignMetadata(null);
      setPrefillAnswers(null);
      return () => {
        cancelled = true;
      };
    }

    setLoadingScanLookup(true);
    setPrefillAnswers(null);

    const lookup = async () => {
      try {
        const result = await badgeScanService.lookupBadge(event.customConfig!.badgeScan!, scanValue);
        if (cancelled) return;
        setPrefillAnswers(result.answers);
        assignMetadata(result.raw);
      } catch (error) {
        console.error('[SurveyPage] Badge lookup failed', error);
        if (cancelled) return;
        setPrefillAnswers({});
        assignMetadata({
          error: error instanceof Error ? error.message : 'Badge lookup failed',
        });
        setToastMessage('Badge lookup failed. The survey will continue without prefilled data.');
      } finally {
        if (!cancelled) {
          setLoadingScanLookup(false);
        }
      }
    };

    lookup();

    return () => {
      cancelled = true;
    };
  }, [event.customConfig, scanTime, scanValue]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const handleSurveyComplete = async (data: any) => {
    console.log('Survey completed:', data);
    // Handle survey completion
  };

  const handleSurveyAbandoned = (abandonedEvent: ExpanseEvent) => {
    console.log('Survey abandoned for event:', abandonedEvent.id);
    // Handle survey abandonment
  };

  return (
    <View style={styles.container}>
      <SurveyScreen
        event={event}
        onSurveyComplete={handleSurveyComplete}
        onSurveyAbandoned={handleSurveyAbandoned}
        initialAnswers={prefillAnswers ?? undefined}
        scanMetadata={scanMetadata ?? undefined}
        isPrefillLoading={loadingScanLookup}
      />
      {toastMessage && <Toast message={toastMessage} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

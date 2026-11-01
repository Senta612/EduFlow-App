import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { subscriptionService } from '@/services/subscription.service';
import { SubscriptionState } from '@/types/subscription';

const INITIAL_STATE: SubscriptionState = {
  subscription: null,
  isPro: false,
  isTrial: false,
  isExpired: false,
  isTrialEligible: false,
  daysRemaining: 0,
  expiryDateFormatted: null,
  pendingRequest: null,
  isLoading: true,
};

export function useSubscription() {
  const { user, profile } = useAuth();
  const [state, setState] = useState<SubscriptionState>(INITIAL_STATE);

  const fetchState = useCallback(async () => {
    if (!user || profile?.role === 'student') {
      setState({
        ...INITIAL_STATE,
        isLoading: false,
      });
      return;
    }

    try {
      const subState = await subscriptionService.getSubscriptionState(user.id);
      setState(subState);
    } catch (e) {
      console.warn('Failed to fetch subscription state:', e);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [user, profile]);

  useEffect(() => {
    fetchState();

    const unsubscribe = subscriptionService.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, [fetchState]);

  const startTrial = useCallback(async () => {
    const sub = await subscriptionService.startTrial();
    await fetchState();
    return sub;
  }, [fetchState]);

  /**
   * Action guard: executes action if Pro is active, or triggers onBlocked with the feature name
   */
  const checkProAction = useCallback(
    (action: () => void, onBlocked?: (feature?: string) => void, feature?: string): boolean => {
      if (state.isPro) {
        action();
        return true;
      }
      if (onBlocked) {
        onBlocked(feature);
      }
      return false;
    },
    [state.isPro],
  );

  return {
    ...state,
    refresh: fetchState,
    startTrial,
    checkProAction,
  };
}

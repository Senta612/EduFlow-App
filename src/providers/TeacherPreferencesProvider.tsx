import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/services/teacher/storage.keys';
import { TeacherPaymentConfig } from '@/types/fee';
import { feesService } from '@/services/teacher/fees.service';

interface TeacherPreferencesContextValue {
  isFeeStatusEnabled: boolean;
  isLoadingPreferences: boolean;
  paymentConfig: TeacherPaymentConfig | null;
  setFeeStatusEnabled: (enabled: boolean) => Promise<void>;
  toggleFeeStatusEnabled: () => Promise<void>;
  updatePaymentConfig: (config: TeacherPaymentConfig) => Promise<void>;
  refreshPreferences: () => Promise<void>;
}

const TeacherPreferencesContext = createContext<
  TeacherPreferencesContextValue | undefined
>(undefined);

export function TeacherPreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isFeeStatusEnabled, setIsFeeStatusEnabledState] = useState<boolean>(false);
  const [paymentConfig, setPaymentConfig] = useState<TeacherPaymentConfig | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState<boolean>(true);

  const loadPreferences = useCallback(async () => {
    try {
      const [storedFeeEnabled, pConfig] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.FEE_STATUS_ENABLED),
        feesService.getPaymentConfig(),
      ]);

      if (storedFeeEnabled !== null) {
        setIsFeeStatusEnabledState(storedFeeEnabled === 'true');
      } else if (pConfig?.isEnabled) {
        setIsFeeStatusEnabledState(true);
      }
      setPaymentConfig(pConfig);
    } catch (err) {
      console.warn('Failed to load teacher fee status preference:', err);
    } finally {
      setIsLoadingPreferences(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const setFeeStatusEnabled = useCallback(async (enabled: boolean) => {
    setIsFeeStatusEnabledState(enabled);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FEE_STATUS_ENABLED,
        enabled ? 'true' : 'false',
      );
      if (paymentConfig) {
        const updatedConfig = { ...paymentConfig, isEnabled: enabled };
        setPaymentConfig(updatedConfig);
        await feesService.savePaymentConfig(updatedConfig);
      }
    } catch (err) {
      console.warn('Failed to persist fee status preference:', err);
    }
  }, [paymentConfig]);

  const toggleFeeStatusEnabled = useCallback(async () => {
    const nextVal = !isFeeStatusEnabled;
    await setFeeStatusEnabled(nextVal);
  }, [isFeeStatusEnabled, setFeeStatusEnabled]);

  const updatePaymentConfig = useCallback(async (config: TeacherPaymentConfig) => {
    setPaymentConfig(config);
    if (config.isEnabled) {
      setIsFeeStatusEnabledState(true);
    }
    await feesService.savePaymentConfig(config);
  }, []);

  return (
    <TeacherPreferencesContext.Provider
      value={{
        isFeeStatusEnabled,
        isLoadingPreferences,
        paymentConfig,
        setFeeStatusEnabled,
        toggleFeeStatusEnabled,
        updatePaymentConfig,
        refreshPreferences: loadPreferences,
      }}
    >
      {children}
    </TeacherPreferencesContext.Provider>
  );
}

export function useTeacherPreferences(): TeacherPreferencesContextValue {
  const context = useContext(TeacherPreferencesContext);
  if (!context) {
    throw new Error(
      'useTeacherPreferences must be used within a TeacherPreferencesProvider',
    );
  }
  return context;
}


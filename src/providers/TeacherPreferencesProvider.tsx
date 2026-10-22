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

interface TeacherPreferencesContextValue {
  isFeeStatusEnabled: boolean;
  isLoadingPreferences: boolean;
  setFeeStatusEnabled: (enabled: boolean) => Promise<void>;
  toggleFeeStatusEnabled: () => Promise<void>;
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
  const [isLoadingPreferences, setIsLoadingPreferences] = useState<boolean>(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.FEE_STATUS_ENABLED);
        if (stored !== null) {
          setIsFeeStatusEnabledState(stored === 'true');
        }
      } catch (err) {
        console.warn('Failed to load teacher fee status preference:', err);
      } finally {
        setIsLoadingPreferences(false);
      }
    }
    loadPreferences();
  }, []);

  const setFeeStatusEnabled = useCallback(async (enabled: boolean) => {
    setIsFeeStatusEnabledState(enabled);
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.FEE_STATUS_ENABLED,
        enabled ? 'true' : 'false',
      );
    } catch (err) {
      console.warn('Failed to persist fee status preference:', err);
    }
  }, []);

  const toggleFeeStatusEnabled = useCallback(async () => {
    const nextVal = !isFeeStatusEnabled;
    await setFeeStatusEnabled(nextVal);
  }, [isFeeStatusEnabled, setFeeStatusEnabled]);

  return (
    <TeacherPreferencesContext.Provider
      value={{
        isFeeStatusEnabled,
        isLoadingPreferences,
        setFeeStatusEnabled,
        toggleFeeStatusEnabled,
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

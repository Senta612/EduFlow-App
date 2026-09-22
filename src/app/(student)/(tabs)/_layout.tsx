import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '@/i18n';
import { theme } from '@/theme';

export default function StudentTabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.paper,
          borderTopColor: theme.colors.border.main,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          title: t('common.homework'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="book-open" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          title: t('common.tests'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="award" size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.more'),
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

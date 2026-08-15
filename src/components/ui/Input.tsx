import {
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useState } from 'react';

import { Text } from '@/components/ui/Text';
import { theme } from '@/theme';
import { InputProps } from '@/types/components';

export function Input({
  label,
  error,
  helperText,
  leftContent,
  rightContent,
  style,
  editable = true,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(error);
  const isDisabled = !editable;

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          hasError && styles.error,
          isDisabled && styles.disabled,
        ]}
      >
        {leftContent && (
          <View style={styles.leftContent}>
            {leftContent}
          </View>
        )}

        <TextInput
          {...props}
          editable={editable}
          onFocus={(event) => {
            setIsFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            props.onBlur?.(event);
          }}
          placeholderTextColor={theme.colors.text.disabled}
          style={[styles.input, style]}
        />

        {rightContent && (
          <View style={styles.rightContent}>
            {rightContent}
          </View>
        )}
      </View>

      {error ? (
        <Text variant="caption" style={styles.errorText}>
          {error}
        </Text>
      ) : helperText ? (
        <Text variant="caption" style={styles.helperText}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  label: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.primary,
  },

  inputContainer: {
    minHeight: theme.spacing.xxl,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: theme.colors.background.paper,

    borderWidth: 1,
    borderColor: theme.colors.border.main,
    borderRadius: theme.radii.md,

    paddingHorizontal: theme.spacing.sm,
  },

  focused: {
    borderColor: theme.colors.border.focus,
  },

  error: {
    borderColor: theme.colors.semantic.danger.main,
  },

  disabled: {
    backgroundColor: theme.colors.background.screen,
    opacity: 0.6,
  },

  input: {
    flex: 1,

    minHeight: theme.spacing.xxl,

    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 0,

    color: theme.colors.text.primary,

    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.regular,
  },

  leftContent: {
    marginRight: theme.spacing.xs,
  },

  rightContent: {
    marginLeft: theme.spacing.xs,
  },

  errorText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.semantic.danger.main,
  },

  helperText: {
    marginTop: theme.spacing.xs,
    color: theme.colors.text.secondary,
  },
});
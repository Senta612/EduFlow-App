import { Text as RNText, StyleSheet } from 'react-native';

import { theme } from '@/theme';
import { TextComponentProps } from '@/types/components';

export function Text({
    variant = 'body',
    style,
    ...props
}: TextComponentProps) {
    return (
        <RNText
            {...props}
            style={[styles.base, styles[variant], style]}
        />
    );
}

const styles = StyleSheet.create({
    base: {
        color: theme.colors.text.primary,
    },

    title: {
        fontSize: theme.typography.sizes.xxl,
        fontWeight: theme.typography.weights.bold,
    },

    heading: {
        fontSize: theme.typography.sizes.xl,
        fontWeight: theme.typography.weights.semibold,
    },

    body: {
        fontSize: theme.typography.sizes.base,
        fontWeight: theme.typography.weights.regular,
    },

    label: {
        fontSize: theme.typography.sizes.sm,
        fontWeight: theme.typography.weights.medium,
    },

    caption: {
        fontSize: theme.typography.sizes.xs,
        fontWeight: theme.typography.weights.regular,
        color: theme.colors.text.secondary,
    },
});
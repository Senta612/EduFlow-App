import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
} from 'react-native';

import { Text } from '@/components/ui/Text';
import { theme } from '@/theme';
import { ButtonProps } from '@/types/components';

export function Button({
    title,
    variant = 'primary',
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <Pressable
            {...props}
            disabled={isDisabled}
            style={(state) => {
                const customStyle =
                    typeof style === 'function'
                        ? style(state)
                        : style;

                return [
                    styles.base,
                    styles[variant],
                    fullWidth && styles.fullWidth,
                    isDisabled && styles.disabled,
                    state.pressed && !isDisabled && styles.pressed,
                    customStyle,
                ];
            }}
        >
            {loading ? (
                <ActivityIndicator
                    size="small"
                    color={
                        variant === 'primary'
                            ? theme.colors.text.inverse
                            : theme.colors.primary.main
                    }
                />
            ) : (
                <Text
                    variant="label"
                    style={[
                        styles.label,
                        variant === 'primary'
                            ? styles.primaryLabel
                            : styles.secondaryLabel,
                    ]}
                >
                    {title}
                </Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        minHeight: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    primary: {
        backgroundColor: theme.colors.primary.main,
    },

    secondary: {
        backgroundColor: theme.colors.background.paper,
        borderWidth: 1,
        borderColor: theme.colors.border.main,
    },

    fullWidth: {
        width: '100%',
    },

    disabled: {
        opacity: 0.5,
    },

    pressed: {
        opacity: 0.8,
    },

    label: {
        textAlign: 'center',
    },

    primaryLabel: {
        color: theme.colors.text.inverse,
    },

    secondaryLabel: {
        color: theme.colors.primary.main,
    },
});
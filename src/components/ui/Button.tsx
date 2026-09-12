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

    const getSpinnerColor = () => {
        switch (variant) {
            case 'primary':
            case 'danger':
                return theme.colors.text.inverse;
            case 'outline':
            case 'ghost':
            case 'secondary':
                return theme.colors.primary.main;
            default:
                return theme.colors.primary.main;
        }
    };

    const getLabelStyle = () => {
        switch (variant) {
            case 'primary':
                return styles.primaryLabel;
            case 'secondary':
                return styles.secondaryLabel;
            case 'outline':
                return styles.outlineLabel;
            case 'danger':
                return styles.dangerLabel;
            case 'ghost':
                return styles.ghostLabel;
            default:
                return styles.primaryLabel;
        }
    };

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
                    color={getSpinnerColor()}
                />
            ) : (
                <Text
                    variant="label"
                    style={[styles.label, getLabelStyle()]}
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
        backgroundColor: '#F1F5F9',
    },

    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: theme.colors.border.main,
    },

    danger: {
        backgroundColor: theme.colors.semantic.danger.main,
    },

    ghost: {
        backgroundColor: 'transparent',
    },

    fullWidth: {
        width: '100%',
    },

    disabled: {
        opacity: 0.5,
    },

    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.99 }],
    },

    label: {
        textAlign: 'center',
        fontWeight: theme.typography.weights.semibold,
    },

    primaryLabel: {
        color: theme.colors.text.inverse,
    },

    secondaryLabel: {
        color: theme.colors.text.primary,
    },

    outlineLabel: {
        color: theme.colors.text.primary,
    },

    dangerLabel: {
        color: theme.colors.text.inverse,
    },

    ghostLabel: {
        color: theme.colors.primary.main,
    },
});
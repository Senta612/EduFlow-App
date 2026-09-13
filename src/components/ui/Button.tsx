import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { Text } from '@/components/ui/Text';
import { theme } from '@/theme';
import { ButtonProps, ButtonSize } from '@/types/components';

export function Button({
    title,
    variant = 'primary',
    size = 'md',
    icon,
    loading = false,
    disabled = false,
    fullWidth = false,
    style,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    const getIconAndSpinnerColor = () => {
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

    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

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
                    styles[`size_${size}` as `size_${ButtonSize}`],
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
                    color={getIconAndSpinnerColor()}
                />
            ) : (
                <View style={styles.contentRow}>
                    {icon && (
                        <Feather
                            name={icon}
                            size={iconSize}
                            color={getIconAndSpinnerColor()}
                            style={styles.btnIcon}
                        />
                    )}
                    <Text
                        variant={size === 'sm' ? 'caption' : 'label'}
                        style={[
                            styles.label,
                            getLabelStyle(),
                            size === 'sm' && styles.labelSm,
                            size === 'lg' && styles.labelLg,
                        ]}
                    >
                        {title}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        borderRadius: theme.radii.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },

    btnIcon: {
        marginRight: 2,
    },

    // Sizes
    size_sm: {
        minHeight: 34,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 6,
        borderRadius: theme.radii.full,
    },

    size_md: {
        minHeight: 44,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: 10,
    },

    size_lg: {
        minHeight: 52,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: 14,
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
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },

    label: {
        textAlign: 'center',
        fontWeight: theme.typography.weights.semibold,
    },

    labelSm: {
        fontSize: theme.typography.sizes.xs + 1,
        fontWeight: theme.typography.weights.bold,
    },

    labelLg: {
        fontSize: theme.typography.sizes.base,
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
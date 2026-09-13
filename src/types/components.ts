import { TextProps as RNTextProps, PressableProps, TextInputProps } from "react-native";

export type TextVariant = "title" | "heading" | "body" | "label" | "caption";

export interface TextComponentProps extends RNTextProps {
  variant?: TextVariant;
}

import { Feather } from "@expo/vector-icons";

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends PressableProps {
    title: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: keyof typeof Feather.glyphMap;
    loading?: boolean;
    fullWidth?: boolean;
}

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}
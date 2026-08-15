import { TextProps as RNTextProps, PressableProps, TextInputProps } from "react-native";

export type TextVariant = "title" | "heading" | "body" | "label" | "caption";

export interface TextComponentProps extends RNTextProps {
  variant?: TextVariant;
}

export type ButtonVariant = 'primary' | 'secondary' ;

export interface ButtonProps extends PressableProps {
    title : string;
    variant?: ButtonVariant;
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
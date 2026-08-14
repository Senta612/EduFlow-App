import { ms } from "react-native-size-matters";

export const typography = {
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  sizes: {
    xs: ms(12),
    sm: ms(14),
    base: ms(16),
    lg: ms(18),
    xl: ms(20),
    xxl: ms(24),
  },
} as const;

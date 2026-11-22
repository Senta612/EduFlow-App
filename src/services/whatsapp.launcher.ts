import { Alert, Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { hapticFeedback } from './haptics.service';

/**
 * Normalizes an Indian or international mobile number into international digits-only format
 * E.g. '9265608255' -> '919265608255', '+91 92656-08255' -> '919265608255'
 */
export function formatWhatsAppPhone(rawPhone?: string | null): string {
  if (!rawPhone) return '';
  const cleaned = rawPhone.replace(/\D/g, '');
  if (!cleaned) return '';

  // 10 digits Indian mobile number (e.g. 9265608255) -> prepend 91
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  // 11 digits with leading 0 (e.g. 09265608255) -> replace 0 with 91
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `91${cleaned.slice(1)}`;
  }
  return cleaned;
}

export interface WhatsAppLaunchOptions {
  phone?: string | null;
  message: string;
  fallbackTitle?: string;
}

/**
 * Senior Developer Pattern: Dual-Protocol WhatsApp Launcher
 * 1. Tries native mobile deep link `whatsapp://send`
 * 2. Gracefully falls back to browser universal link `https://wa.me/`
 * 3. Final fallback allows 1-tap copy to clipboard if WhatsApp is not installed.
 */
export async function launchWhatsApp(
  optionsOrPhone: WhatsAppLaunchOptions | string | null | undefined,
  messageText?: string,
  fallbackTitleParam?: string,
): Promise<boolean> {
  const isOptionsObj = typeof optionsOrPhone === 'object' && optionsOrPhone !== null;
  const phone = isOptionsObj ? optionsOrPhone.phone : optionsOrPhone;
  const message = (isOptionsObj ? optionsOrPhone.message : messageText) || '';
  const fallbackTitle =
    (isOptionsObj ? optionsOrPhone.fallbackTitle : fallbackTitleParam) ||
    'WhatsApp Not Available';

  const formattedPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message.trim());

  // 1. Native app URL
  const nativeUrl = formattedPhone
    ? `whatsapp://send?phone=${formattedPhone}&text=${encodedText}`
    : `whatsapp://send?text=${encodedText}`;

  // 2. Web universal link fallback
  const webUrl = formattedPhone
    ? `https://wa.me/${formattedPhone}?text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  try {
    const canOpenNative = await Linking.canOpenURL(nativeUrl).catch(() => false);
    if (canOpenNative) {
      await hapticFeedback.light();
      await Linking.openURL(nativeUrl);
      return true;
    }

    // Try web URL fallback
    const canOpenWeb = await Linking.canOpenURL(webUrl).catch(() => false);
    if (canOpenWeb) {
      await hapticFeedback.light();
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (err) {
    console.warn('Error launching WhatsApp:', err);
  }

  // Fallback: Copy message to clipboard
  await hapticFeedback.warning();
  Alert.alert(
    fallbackTitle,
    'WhatsApp could not be opened automatically. Would you like to copy the message to your clipboard?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Copy Message',
        style: 'default',
        onPress: async () => {
          await Clipboard.setStringAsync(message);
          await hapticFeedback.success();
          Alert.alert('Copied!', 'Message copied to clipboard.');
        },
      },
    ],
  );
  return false;
}

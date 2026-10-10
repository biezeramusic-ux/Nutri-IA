import { Alert as RNAlert, type AlertButton, type AlertOptions } from 'react-native';
import { tr } from './index';

/** Alert que traduz título, mensagem e botões. */
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
    RNAlert.alert(
      tr(title),
      message ? tr(message) : message,
      buttons?.map((b) => ({ ...b, text: b.text ? tr(b.text) : b.text })),
      options,
    );
  },
};

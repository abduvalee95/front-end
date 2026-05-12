import type uz from '../../messages/uz.json';

type Messages = typeof uz;

declare global {
  interface IntlMessages extends Messages {}
}

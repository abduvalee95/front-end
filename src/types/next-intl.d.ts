import type uz from '../../messages/uz.json';

type Messages = typeof uz;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}

import moment from 'moment';

export function truncDateString(str) {
  return str ? moment(str, 'DD.MM.YYYY').format('DD.MM.YYYY') : '';
}

import {OfferingId} from '#/state/purchases/subscriptions/types';

export function parseOfferingId(id: string): OfferingId {
  switch (id) {
    case 'coreMonthly':
      return OfferingId.CoreMonthly;
    case 'coreAnnual':
      return OfferingId.CoreAnnual;
    default:
      throw new Error(`Unknown offering id: ${id}`);
  }
}

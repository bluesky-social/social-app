import {useMutation,useQuery} from '@tanstack/react-query'

import {useCurrencyFormatter} from '#/lib/currency'
import {Subscription} from '#/state/purchases/useSubscriptions/types'
import {
  StripePrice,
  StripeProduct,
} from '#/state/purchases/useSubscriptions/types/stripe'
import {identifierToSubscriptionInfo} from '#/state/purchases/useSubscriptions/util'
import {useSession} from '#/state/session'

export function useAvailableSubscriptions() {
  const {currentAccount} = useSession()
  const currencyFormatter = useCurrencyFormatter()

  return useQuery<Subscription[]>({
    queryKey: ['availableSubscriptions', currentAccount!.did],
    async queryFn() {
      return normalizeProducts(RESPONSE, {
        currencyFormatter,
      })
    },
  })
}

export function usePurchaseSubscription() {
  return useMutation({
    async mutationFn(_priceObject: any) {},
  })
}

function normalizeProducts(
  products: {product: StripeProduct; price: StripePrice}[],
  options: {
    currencyFormatter: ReturnType<typeof useCurrencyFormatter>
  },
): Subscription[] {
  return products
    .map(({product, price}) => {
      const info = identifierToSubscriptionInfo(product.name)

      if (!info) return

      const priceObj =
        price.currency_options[options.currencyFormatter.currency]
      const value = priceObj.unit_amount
      const formatted = options.currencyFormatter.format(value / 100)

      return {
        info,
        pricing: {
          value,
          formatted,
        },
        raw: {
          price_id: price.id,
        },
      }
    })
    .filter(Boolean) as Subscription[]
}

const RESPONSE = [
  {
    product: {
      id: 'prod_R2eNjNa6mB1Jlu',
      object: 'product',
      active: true,
      attributes: [],
      created: 1729092225,
      default_price: 'price_1QAZ4fAwTlpRxHkARl1gtw5C',
      description: null,
      features: [],
      images: [],
      livemode: false,
      marketing_features: [],
      metadata: {},
      name: 'bsky_tier_0_monthly',
      package_dimensions: null,
      shippable: null,
      statement_descriptor: null,
      tax_code: 'txcd_10000000',
      type: 'service',
      unit_label: null,
      updated: 1729869343,
      url: null,
    },
    price: {
      id: 'price_1QAZ4fAwTlpRxHkARl1gtw5C',
      object: 'price',
      active: true,
      billing_scheme: 'per_unit',
      created: 1729092225,
      currency: 'usd',
      currency_options: {
        gbp: {
          custom_unit_amount: null,
          tax_behavior: 'inclusive',
          unit_amount: 250,
          unit_amount_decimal: '250',
        },
        usd: {
          custom_unit_amount: null,
          tax_behavior: 'inclusive',
          unit_amount: 300,
          unit_amount_decimal: '300',
        },
      },
      custom_unit_amount: null,
      livemode: false,
      lookup_key: null,
      metadata: {},
      nickname: null,
      product: 'prod_R2eNjNa6mB1Jlu',
      recurring: {
        aggregate_usage: null,
        interval: 'month',
        interval_count: 1,
        meter: null,
        trial_period_days: null,
        usage_type: 'licensed',
      },
      tax_behavior: 'inclusive',
      tiers_mode: null,
      transform_quantity: null,
      type: 'recurring',
      unit_amount: 300,
      unit_amount_decimal: '300',
    },
  },
  {
    product: {
      id: 'prod_R37Zg28EeQ9XAz',
      object: 'product',
      active: true,
      attributes: [],
      created: 1729200807,
      default_price: 'price_1QB1K0AwTlpRxHkA4Mdfxati',
      description: null,
      features: [],
      images: [],
      livemode: false,
      marketing_features: [],
      metadata: {},
      name: 'bsky_tier_0_annual',
      package_dimensions: null,
      shippable: null,
      statement_descriptor: null,
      tax_code: 'txcd_10000000',
      type: 'service',
      unit_label: null,
      updated: 1729869329,
      url: null,
    },
    price: {
      id: 'price_1QB1K0AwTlpRxHkA4Mdfxati',
      object: 'price',
      active: true,
      billing_scheme: 'per_unit',
      created: 1729200808,
      currency: 'usd',
      currency_options: {
        gbp: {
          custom_unit_amount: null,
          tax_behavior: 'inclusive',
          unit_amount: 2000,
          unit_amount_decimal: '2000',
        },
        usd: {
          custom_unit_amount: null,
          tax_behavior: 'inclusive',
          unit_amount: 2400,
          unit_amount_decimal: '2400',
        },
      },
      custom_unit_amount: null,
      livemode: false,
      lookup_key: null,
      metadata: {},
      nickname: null,
      product: 'prod_R37Zg28EeQ9XAz',
      recurring: {
        aggregate_usage: null,
        interval: 'year',
        interval_count: 1,
        meter: null,
        trial_period_days: null,
        usage_type: 'licensed',
      },
      tax_behavior: 'inclusive',
      tiers_mode: null,
      transform_quantity: null,
      type: 'recurring',
      unit_amount: 2400,
      unit_amount_decimal: '2400',
    },
  },
]

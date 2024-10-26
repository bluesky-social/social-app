export type StripeProduct = {
  // main stuff
  id: string
  default_price: string // ID of Price obj
  name: string
  active: boolean
  // other stuff
  object: string
  attributes: unknown[]
  created: number
  description: string | null
  features: unknown[]
  images: unknown[]
  livemode: boolean
  marketing_features: unknown[]
  metadata: unknown
  package_dimensions: unknown | null
  shippable: unknown | null
  statement_descriptor: unknown | null
  tax_code: string
  type: 'service' | string
  unit_label: unknown | null
  updated: number
  url: string | null
}

export type StripePrice = {
  // main stuff
  id: string
  product: string // Product obj associated
  currency_options: {
    [key: string]: {
      custom_unit_amount: number | null
      tax_behavior: 'inclusive' | string
      unit_amount: number
      unit_amount_decimal: string
    }
  }
  active: boolean
  recurring: {
    interval: 'month' | 'year' | string
    interval_count: number
    usage_type: 'licensed' | string
  }
  object: 'price' | string
  type: 'recurring' | string
  // other stuff
  metadata: unknown
  unit_amount: number // default Price in cents
  currency: string // default currency
  tax_behavior: 'inclusive' | string // default tax behavior
  billing_scheme: 'per_unit' | string
  created: number
  custom_unit_amount: number | null
  livemode: boolean
  lookup_key: string | null
  nickname: string | null
  tiers_mode: string | null
  transform_quantity: string | null
}

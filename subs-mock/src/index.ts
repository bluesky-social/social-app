import {Hono} from 'hono'
import {cors} from 'hono/cors'
import {HTTPException} from 'hono/http-exception'
import ky, {KyInstance} from 'ky'
import Stripe from 'stripe'

import {
  getMainSubscriptionProducts,
  normalizeEntitlements,
  RevenueCatSubscription,
} from './util'

type Bindings = {
  STRIPE_API_KEY: string
  RC_API_KEY_V2: string
  RC_API_KEY_V1: string
  RC_PROJECT_ID: string
}

type Variables = {
  rcv1: KyInstance
  rcv2: KyInstance
  stripe: Stripe
}

export default new Hono<{Bindings: Bindings; Variables: Variables}>()
  .use(
    cors({
      origin: [
        'http://localhost:19006',
        'https://main.bsky.dev',
        'https://bsky.app',
      ],
      allowMethods: ['GET'],
      exposeHeaders: ['Content-Length'],
      maxAge: 600,
      credentials: true,
    }),
  )
  .use(async (c, next) => {
    const rcv1 = ky.create({
      prefixUrl: 'https://api.revenuecat.com/v1',
      headers: {
        Authorization: `Bearer ${c.env.RC_API_KEY_V1}`,
      },
    })
    const rcv2 = ky.create({
      prefixUrl: `https://api.revenuecat.com/v2/projects/${c.env.RC_PROJECT_ID}`,
      headers: {
        Authorization: `Bearer ${c.env.RC_API_KEY_V2}`,
      },
    })
    const stripe = new Stripe(c.env.STRIPE_API_KEY)
    c.set('rcv1', rcv1)
    c.set('rcv2', rcv2)
    c.set('stripe', stripe)
    await next()
  })

  /**
   * Get subscription products for a given offering
   */
  .get('/subscriptions/:offering_lookup_key', async c => {
    const rc = c.get('rcv2')
    const {user, platform} = c.req.query()
    const {offering_lookup_key} = c.req.param()

    const {items} = await rc
      .get<{items: any[]}>(`offerings?expand=items.package.product`)
      .json()
    const offering = items.find(i => i.lookup_key == offering_lookup_key)

    if (!offering) {
      throw new HTTPException(404, {message: `Offering not found`})
    }

    const products = offering.packages.items
      .flatMap((i: any) => i.products.items)
      .map((i: any) => i.product)

    let subscriptions: any[] = []

    try {
      const {items} = await rc
        .get<{
          items: RevenueCatSubscription[]
        }>(`customers/${user}/subscriptions`)
        .json()
      subscriptions = items
    } catch (e) {}

    let normalizedProducts = getMainSubscriptionProducts(
      products,
      subscriptions,
    )
    const activeProducts = normalizedProducts.filter(p => p.active)

    if (platform === 'web') {
      const stripe = c.get('stripe')

      normalizedProducts = normalizedProducts.filter(
        p => p.provider === 'stripe',
      )

      const ids = normalizedProducts.map(p => p.storeId)
      const {data} = await stripe.products.list({ids})
      const prices = await Promise.all(
        data.map(p => {
          if (typeof p.default_price === 'string') {
            return stripe.prices.retrieve(p.default_price, {
              expand: ['currency_options'],
            })
          } else {
            return p.default_price
          }
        }),
      )

      for (const product of normalizedProducts) {
        if (product.provider !== 'stripe') continue
        for (const price of prices) {
          if (!price) continue
          if (price.product === product.storeId) {
            product.price = price.unit_amount ?? undefined
            product.checkoutId = price.id
            break
          }
        }
      }
    } else if (platform === 'ios') {
    } else if (platform === 'android') {
      normalizedProducts = normalizedProducts.filter(
        p => p.provider === 'play_store',
      )
    }

    return c.json({active: activeProducts, available: normalizedProducts})
  })

  /**
   * Update a subscription (web only)
   */
  .post(`/subscriptions/update`, async c => {
    const stripe = c.get('stripe')
    const {stripeSubscriptionItemId, newPriceId} = await c.req.json()
    const subscriptionItem = await stripe.subscriptionItems.retrieve(
      stripeSubscriptionItemId,
    )
    // TODO get customer and compare DID to auth state to ensure it's legit
    const subscription = await stripe.subscriptions.update(
      subscriptionItem.subscription,
      {
        items: [
          {
            id: stripeSubscriptionItemId,
            deleted: true,
          },
          {
            price: newPriceId,
          },
        ],
      },
    )

    return c.json({
      oldItem: subscriptionItem,
      subscription,
    })
  })

  /**
   * Get entitlements for a user
   */
  .get('/entitlements', async c => {
    const rc = c.get('rcv2')
    const user = c.req.query('user')

    const {items: activeEntitlements} = await rc
      .get<{
        items: {entitlement_id: string}[]
      }>(`customers/${user}/active_entitlements`)
      .json()
    const entitlements = await Promise.all(
      activeEntitlements.map(e => {
        return rc.get(`entitlements/${e.entitlement_id}?expand=product`).json()
      }),
    )
    const normalized = normalizeEntitlements(entitlements)

    return c.json({entitlements: normalized})
  })

  /**
   * Create a Stripe checkout session (web only)
   */
  .post('/createCheckout', async c => {
    const DOMAIN = `http://localhost:19006`
    const stripe = c.get('stripe')

    const {price, user, email} = await c.req.json()

    // TODO should store this in a db
    const customers = await stripe.customers.search({
      query: `email:"${email}"`,
    })

    let customer: Stripe.Customer | undefined =
      customers.data.at(0)?.email === email ? customers.data[0] : undefined

    if (!customer) {
      customer = await stripe.customers.create({
        email,
        metadata: {
          did: user,
        },
      })
    }

    const session = await stripe.checkout.sessions.create({
      client_reference_id: user,
      customer: customer.id,
      customer_update: {
        address: 'auto',
        name: 'auto',
        shipping: 'auto',
      },
      saved_payment_method_options: {
        payment_method_save: 'enabled',
      },
      line_items: [
        {
          price: price,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${DOMAIN}/subscriptions?success=true`,
      cancel_url: `${DOMAIN}/subscriptions?canceled=true`,
      automatic_tax: {enabled: true},
    })

    if (!session.url) {
      throw new HTTPException(400, {message: `Failed to create checkout`})
    }

    return c.json({checkoutUrl: session.url})
  })

  /**
   * Listen for Stripe webhooks
   * @see https://docs.stripe.com/webhooks#local-listener
   */
  .post('/webhooks/stripe', async c => {
    const stripe = c.get('stripe')
    const rc = c.get('rcv1')

    const {type, data} = await c.req.json()

    if (type === 'customer.subscription.created') {
      const {object: sub} = data
      const customer = await stripe.customers.retrieve(sub.customer)
      if (!customer.deleted) {
        const payload = {
          fetch_token: sub.id,
          app_user_id: customer.metadata.did,
        }
        try {
          const res = await rc
            .post(`receipts`, {
              json: payload,
              headers: {
                'X-Platform': 'stripe',
              },
            })
            .json()
          console.log(`success`, res)
        } catch (e) {
          console.error(`failed to send receipt`, e)
        }
      }
    }
    return c.text('ok')
  })

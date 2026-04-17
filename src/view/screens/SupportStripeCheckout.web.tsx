import {useCallback, useMemo, useState} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import {loadStripe} from '@stripe/stripe-js/pure'

import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as SegmentedControl from '#/components/forms/SegmentedControl'
import * as TextField from '#/components/forms/TextField'
import {Text} from '#/components/Typography'
import {STRIPE_API_URL, STRIPE_PUBLISHABLE_KEY} from '#/env/common'

const PRESET_AMOUNTS = [5, 10, 25, 50]

export function SupportStripeCheckout() {
  const {_} = useLingui()
  const t = useTheme()
  const [amount, setAmount] = useState('7')
  const [recurring, setRecurring] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Defer Stripe.js loading until this component actually mounts, so visitors
  // who never open the Support page don't trigger requests to js.stripe.com.
  const stripePromise = useMemo(
    () => (STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null),
    [],
  )

  const parsedAmount = useMemo(() => {
    const num = parseFloat(amount)
    return isNaN(num) ? 0 : num
  }, [amount])

  const isValid = parsedAmount >= 5 && parsedAmount <= 1000

  const validationError = useMemo(() => {
    if (!amount) return null
    if (isNaN(parseFloat(amount))) return _(msg`Please enter a valid number`)
    if (parsedAmount < 5) return _(msg`Minimum support amount is $5`)
    if (parsedAmount > 1000) return _(msg`Maximum support amount is $1,000`)
    return null
  }, [amount, parsedAmount, _])

  const handlePresetPress = useCallback((value: number) => {
    setAmount(String(value))
    setError(null)
  }, [])

  const handleFrequencyChange = useCallback((value: string) => {
    setRecurring(value === 'monthly')
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!isValid || !STRIPE_API_URL) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${STRIPE_API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          amount: Math.round(parsedAmount * 100),
          recurring,
        }),
      })
      if (!res.ok) {
        throw new Error('Failed to create checkout session')
      }
      const data = await res.json()
      setClientSecret(data.clientSecret)
    } catch (e: any) {
      setError(e.message || _(msg`Something went wrong. Please try again.`))
    } finally {
      setLoading(false)
    }
  }, [isValid, parsedAmount, recurring, _])

  if (!STRIPE_PUBLISHABLE_KEY || !STRIPE_API_URL) {
    return null
  }

  if (clientSecret && stripePromise) {
    return (
      <View style={[a.rounded_md, a.overflow_hidden]}>
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{clientSecret}}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </View>
    )
  }

  const buttonLabel = recurring
    ? _(msg`Support $${parsedAmount.toFixed(2)}/mo`)
    : _(msg`Support $${parsedAmount.toFixed(2)}`)

  return (
    <View
      style={[
        a.p_lg,
        a.rounded_md,
        a.border,
        t.atoms.border_contrast_low,
        t.atoms.bg_contrast_25,
        a.gap_lg,
      ]}>
      <Text style={[a.text_lg, a.font_bold]}>
        <Trans>Support with Card</Trans>
      </Text>

      <View style={[a.flex_row, a.gap_sm, a.flex_wrap]}>
        {PRESET_AMOUNTS.map(preset => (
          <Button
            key={preset}
            label={`$${preset}`}
            size="small"
            variant={parsedAmount === preset ? 'solid' : 'outline'}
            color={parsedAmount === preset ? 'primary' : 'secondary'}
            onPress={() => handlePresetPress(preset)}>
            <ButtonText>${preset}</ButtonText>
          </Button>
        ))}
      </View>

      <View>
        <TextField.LabelText>
          <Trans>Custom amount</Trans>
        </TextField.LabelText>
        <View style={[a.flex_row, a.align_center, a.gap_xs]}>
          <Text style={[a.text_md]}>$</Text>
          <View style={[a.flex_1]}>
            <TextField.Root>
              <TextField.Input
                label={_(msg`Custom amount`)}
                value={amount}
                onChangeText={text => {
                  setAmount(text)
                  setError(null)
                }}
                keyboardType="numeric"
                placeholder={_(msg`Enter amount`)}
              />
            </TextField.Root>
          </View>
        </View>
        {validationError && (
          <Text style={[a.text_sm, a.pt_xs, {color: t.palette.negative_500}]}>
            {validationError}
          </Text>
        )}
      </View>

      <SegmentedControl.Root
        label={_(msg`Support frequency`)}
        type="radio"
        value={recurring ? 'monthly' : 'one-time'}
        onChange={handleFrequencyChange}>
        <SegmentedControl.Item value="one-time" label={_(msg`One-time`)}>
          <SegmentedControl.ItemText>
            <Trans>One-time</Trans>
          </SegmentedControl.ItemText>
        </SegmentedControl.Item>
        <SegmentedControl.Item value="monthly" label={_(msg`Monthly`)}>
          <SegmentedControl.ItemText>
            <Trans>Monthly</Trans>
          </SegmentedControl.ItemText>
        </SegmentedControl.Item>
      </SegmentedControl.Root>

      {error && (
        <Text style={[a.text_sm, {color: t.palette.negative_500}]}>
          {error}
        </Text>
      )}

      <Button
        label={buttonLabel}
        size="large"
        variant="solid"
        color="primary"
        disabled={!isValid || loading}
        onPress={handleSubmit}>
        <ButtonText>
          {loading ? <Trans>Processing...</Trans> : buttonLabel}
        </ButtonText>
      </Button>
    </View>
  )
}

export default SupportStripeCheckout

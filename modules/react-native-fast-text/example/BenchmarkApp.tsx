import {useEffect, useLayoutEffect, useRef, useState} from 'react'
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native'
import {useFonts} from 'expo-font'
import {setupI18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {Text as FastText} from '../src'
import {type SpecimenPage, Specimens} from './Specimens'
import {
  TypographyBefore,
  TypographyFast,
  TypographyWrapper,
} from './TypographyVariants'
import {Text as UpstreamText} from './UpstreamText'

export type Renderer =
  | 'react-native'
  | 'plain-text'
  | 'fast-text'
  | 'typography-before'
  | 'typography-wrapper'
  | 'typography-fast'
export type Workload =
  'label' | 'lingui' | 'fragments' | 'nested' | 'emoji-label' | 'emoji-mixed'
export type Configuration = {
  renderers?: Renderer[]
  workloads?: Workload[]
  count?: number
  rounds?: number
  warmups?: number
}
export type Sample = {
  renderer: Renderer
  workload: Workload
  count: number
  round: number
  warmup: boolean
  jsCommitMs: number
  layoutMs: number
  settledMs: number
}
type Trial = Omit<Sample, 'jsCommitMs' | 'layoutMs' | 'settledMs'> & {
  key: number
  startedAt: number
}
type Completion = {
  commitAt?: number
  layoutAt?: number
  resolve: (sample: Sample) => void
}
export type Result = {
  schemaVersion: number
  timestamp: string
  environment: {
    platform: string
    osVersion: string | number
    development: boolean
    reactNative: typeof Platform.constants.reactNativeVersion
    engine: string
  }
  configuration: Required<Configuration>
  samples: Sample[]
}
type BenchmarkApi = {
  run: (configuration?: Configuration) => Promise<Result>
  samples: React.RefObject<Sample[]>
  measurements: React.RefObject<Record<string, unknown>>
  lastResult?: Result
  showSpecimens: (renderer: Renderer, page?: SpecimenPage) => void
}
const benchmarkGlobal = globalThis as typeof globalThis & {
  __FAST_TEXT_BENCHMARK__?: BenchmarkApi
}

const i18n = setupI18n({
  locale: 'en',
  messages: {
    en: {
      'benchmark.greeting': ['Hello, ', ['name'], '!'],
      'benchmark.counter': ['Count: ', ['presses']],
      'benchmark.rich': ['Hello, <0>Ada</0>!'],
    },
    fr: {
      'benchmark.greeting': ['Bonjour, ', ['name'], ' !'],
      'benchmark.counter': ['Compteur : ', ['presses']],
      'benchmark.rich': ['Bonjour, <0>Ada</0> !'],
    },
  },
})
const renderers = {
  'react-native': RNText,
  'plain-text': UpstreamText,
  'fast-text': FastText,
  'typography-before': TypographyBefore,
  'typography-wrapper': TypographyWrapper,
  'typography-fast': TypographyFast,
}
const pause = (milliseconds: number) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds))
const frame = () =>
  new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

function Cells({trial}: {trial: Trial}) {
  const Text = renderers[trial.renderer]
  const cells = []
  for (let index = 0; index < trial.count; index++) {
    const name = `person ${index}`
    const value = `Hello, ${name}!`
    cells.push(
      <Text
        key={index}
        style={styles.label}
        numberOfLines={1}
        {...(trial.renderer.startsWith('typography') &&
        trial.workload.startsWith('emoji')
          ? {emoji: true}
          : {})}>
        {trial.workload === 'label' || trial.workload === 'emoji-label' ? (
          value
        ) : trial.workload === 'emoji-mixed' ? (
          `${value} 👋`
        ) : trial.workload === 'lingui' ? (
          <Trans id="benchmark.greeting">Hello, {name}!</Trans>
        ) : trial.workload === 'fragments' ? (
          <>Hello, {name}!</>
        ) : (
          <>
            Hello, <Text style={styles.bold}>{name}</Text>!
          </>
        )}
      </Text>,
    )
  }
  return <>{cells}</>
}

function TrialView({
  trial,
  completion,
}: {
  trial: Trial
  completion: Completion
}) {
  useLayoutEffect(() => {
    completion.commitAt = performance.now()
  }, [completion])

  function onLayout() {
    if (completion.layoutAt !== undefined) return
    completion.layoutAt = performance.now()
    void (async () => {
      await frame()
      await frame()
      completion.resolve({
        renderer: trial.renderer,
        workload: trial.workload,
        count: trial.count,
        round: trial.round,
        warmup: trial.warmup,
        jsCommitMs:
          (completion.commitAt ?? completion.layoutAt!) - trial.startedAt,
        layoutMs: completion.layoutAt! - trial.startedAt,
        settledMs: performance.now() - trial.startedAt,
      })
    })()
  }

  return (
    <View onLayout={onLayout} testID="benchmark-cells">
      <Cells trial={trial} />
    </View>
  )
}

export function BenchmarkApp() {
  const [fontsLoaded] = useFonts({
    InterVariable: require('../../../assets/fonts/inter/InterVariable.ttf'),
    InterVariableItalic: require('../../../assets/fonts/inter/InterVariable-Italic.ttf'),
    'Inter-Regular': require('../../../assets/fonts/inter/Inter-Regular.otf'),
    'Inter-Medium': require('../../../assets/fonts/inter/Inter-Medium.otf'),
    'Inter-SemiBold': require('../../../assets/fonts/inter/Inter-SemiBold.otf'),
    'Inter-Bold': require('../../../assets/fonts/inter/Inter-Bold.otf'),
    'Inter-Italic': require('../../../assets/fonts/inter/Inter-Italic.otf'),
    'Inter-MediumItalic': require('../../../assets/fonts/inter/Inter-MediumItalic.otf'),
    'Inter-SemiBoldItalic': require('../../../assets/fonts/inter/Inter-SemiBoldItalic.otf'),
    'Inter-BoldItalic': require('../../../assets/fonts/inter/Inter-BoldItalic.otf'),
  })
  const [trial, setTrial] = useState<Trial | null>(null)
  const [specimen, setSpecimen] = useState<{
    renderer: Renderer
    page: SpecimenPage
  } | null>(null)
  const measurements = useRef<Record<string, unknown>>({})
  const [status, setStatus] = useState('Ready')
  const running = useRef(false)
  const sequence = useRef(0)
  const completion = useRef<Completion | null>(null)
  const samples = useRef<Sample[]>([])
  const lastResult = useRef<Result | undefined>(undefined)

  async function run(configuration: Configuration = {}) {
    if (running.current) throw new Error('A benchmark is already running')
    running.current = true
    setSpecimen(null)
    i18n.activate('en')
    samples.current = []
    const selected = configuration.renderers ?? [
      'react-native',
      'plain-text',
      'fast-text',
    ]
    const workloads = configuration.workloads ?? [
      'label',
      'lingui',
      'fragments',
      'nested',
    ]
    const count = configuration.count ?? 400
    const rounds = configuration.rounds ?? 8
    const warmups = configuration.warmups ?? 2
    try {
      for (const workload of workloads) {
        for (let round = -warmups; round < rounds; round++) {
          const offset =
            ((round % selected.length) + selected.length) % selected.length
          const rotated = [
            ...selected.slice(offset),
            ...selected.slice(0, offset),
          ]
          const order = round % 2 === 0 ? rotated : rotated.reverse()
          for (const renderer of order) {
            setTrial(null)
            setStatus(`${workload} / ${renderer} / ${round + 1}`)
            await pause(100)
            await frame()
            const sample = await new Promise<Sample>((resolve, reject) => {
              const timeout = setTimeout(
                () => reject(new Error('Layout timed out')),
                30000,
              )
              completion.current = {
                resolve(value) {
                  clearTimeout(timeout)
                  resolve(value)
                },
              }
              setTrial({
                renderer,
                workload,
                count,
                round,
                warmup: round < 0,
                key: ++sequence.current,
                startedAt: performance.now(),
              })
            })
            samples.current.push(sample)
          }
        }
      }
      const result: Result = {
        schemaVersion: 1,
        timestamp: new Date().toISOString(),
        environment: {
          platform: Platform.OS,
          osVersion: Platform.Version,
          development: __DEV__,
          reactNative: Platform.constants.reactNativeVersion,
          engine: 'Hermes',
        },
        configuration: {renderers: selected, workloads, count, rounds, warmups},
        samples: samples.current,
      }
      lastResult.current = result
      if (benchmarkGlobal.__FAST_TEXT_BENCHMARK__)
        benchmarkGlobal.__FAST_TEXT_BENCHMARK__.lastResult = result
      const response = await fetch('http://127.0.0.1:8124/results', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(result),
      })
      setStatus(
        `Complete: ${samples.current.length} samples (${response.status})`,
      )
      return result
    } catch (error) {
      setStatus(`Error: ${String(error)}`)
      throw error
    } finally {
      running.current = false
    }
  }

  useEffect(() => {
    benchmarkGlobal.__FAST_TEXT_BENCHMARK__ = {
      run,
      samples,
      measurements,
      lastResult: lastResult.current,
      showSpecimens(renderer: Renderer, page: SpecimenPage = 'styles') {
        if (running.current) throw new Error('Benchmark is running')
        measurements.current = {}
        setTrial(null)
        setSpecimen({renderer, page})
        setStatus('Compatibility specimens')
      },
    }
    return () => {
      delete benchmarkGlobal.__FAST_TEXT_BENCHMARK__
    }
  })

  useEffect(() => {
    if (!fontsLoaded) return
    function open(url: string | null | undefined) {
      if (!url?.startsWith('fasttextbench://')) return
      const parsed = new URL(url)
      if (parsed.hostname === 'specimens') {
        const renderer = parsed.searchParams.get('renderer') ?? 'fast-text'
        const page = parsed.searchParams.get('page') ?? 'styles'
        if (
          Object.hasOwn(renderers, renderer) &&
          (page === 'styles' || page === 'behavior')
        ) {
          benchmarkGlobal.__FAST_TEXT_BENCHMARK__?.showSpecimens(
            renderer as Renderer,
            page,
          )
        }
        return
      }
      if (parsed.hostname !== 'run') return
      const group = parsed.searchParams.get('group')
      const configuration: Configuration =
        group === 'typography'
          ? {
              renderers: [
                'typography-before',
                'typography-wrapper',
                'typography-fast',
              ],
              workloads: [
                'label',
                'lingui',
                'fragments',
                'nested',
                'emoji-label',
                'emoji-mixed',
              ],
              count: 400,
              rounds: 12,
              warmups: 3,
            }
          : {
              renderers: ['react-native', 'plain-text', 'fast-text'],
              workloads: ['label', 'lingui', 'fragments', 'nested'],
              count: 400,
              rounds: 12,
              warmups: 3,
            }
      void benchmarkGlobal.__FAST_TEXT_BENCHMARK__
        ?.run(configuration)
        .catch(console.error)
    }
    const subscription = Linking.addEventListener('url', event =>
      open(event.url),
    )
    void Linking.getInitialURL().then(open)
    return () => subscription.remove()
  }, [fontsLoaded])

  if (!fontsLoaded) return <RNText>Loading benchmark fonts</RNText>

  return (
    <I18nProvider i18n={i18n}>
      <View style={styles.screen}>
        <RNText style={styles.title}>Fast Text laboratory</RNText>
        <RNText testID="benchmark-status" style={styles.status}>
          {status}
        </RNText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Run text benchmarks"
          accessibilityHint="Starts an alternating series of bulk mount measurements"
          testID="run-benchmarks"
          onPress={() => {
            void run()
          }}
          style={styles.button}>
          <RNText style={styles.buttonText}>Run benchmarks</RNText>
        </Pressable>
        <ScrollView style={styles.scroll}>
          {specimen ? (
            <Specimens
              key={specimen.renderer + specimen.page}
              Text={renderers[specimen.renderer]}
              page={specimen.page}
              measurements={measurements.current}
            />
          ) : trial && completion.current ? (
            <TrialView
              key={trial.key}
              trial={trial}
              completion={completion.current}
            />
          ) : (
            <RNText style={styles.label}>
              Identical text, styles and native layout. Alternating renderer
              order. Warm-up samples are retained and excluded from summaries.
            </RNText>
          )}
        </ScrollView>
      </View>
    </I18nProvider>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 72,
    paddingHorizontal: 20,
  },
  title: {fontSize: 24, fontWeight: '700', color: '#111827'},
  status: {fontSize: 13, color: '#4b5563', paddingVertical: 10},
  button: {
    backgroundColor: '#006aff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {fontSize: 16, fontWeight: '600', color: '#ffffff'},
  scroll: {flex: 1, marginTop: 16},
  label: {fontSize: 16, lineHeight: 22, color: '#111827'},
  bold: {fontWeight: '700'},
})

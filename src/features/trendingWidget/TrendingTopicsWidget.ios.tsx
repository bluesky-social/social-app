import {createWidget, type WidgetEnvironment} from 'expo-widgets'
import {
  Divider,
  HStack,
  Image,
  Link,
  Spacer,
  Text,
  VStack,
} from '@expo/ui/swift-ui'
import {
  background,
  clipShape,
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  padding,
  resizable,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers'

export type TrendingTopicsWidgetProps = {
  emptyMessage?: string
  /**
   * Header for the small widget, which has no room for `title`.
   */
  shortTitle?: string
  title?: string
  topics?: {
    description?: string
    destination: string
    displayName: string
  }[]
}

function TrendingTopicsWidget(
  props: TrendingTopicsWidgetProps,
  environment: WidgetEnvironment,
) {
  'use no memo'
  'widget'

  const isDark = environment.colorScheme === 'dark'
  const isSmall = environment.widgetFamily === 'systemSmall'
  const isMedium = environment.widgetFamily === 'systemMedium'
  const topicLimit = isSmall || isMedium ? 3 : 5
  const topics = (props.topics ?? []).slice(0, topicLimit)
  const backgroundColor = isDark ? '#10161F' : '#FFFFFF'
  const textColor = isDark ? '#F1F3F5' : '#0A0A0A'
  const secondaryTextColor = isDark ? '#AEBBC9' : '#536471'
  const borderColor = isDark ? '#2E4052' : '#E5E7EB'
  /*
   * Explore, tagged for `trendingWidget:explore:click` (see links.ts). Small
   * widgets can't contain links, so this is their only tap target.
   */
  const rootDestination = `https://bsky.app/search?ref_src=widget&ref_size=${environment.widgetFamily}`

  function TopicRow({
    topic,
    rank,
  }: {
    topic: {
      description?: string
      destination: string
      displayName: string
    }
    rank: number
  }) {
    'use no memo'

    const row = isSmall ? (
      <HStack alignment="top" spacing={5} modifiers={[padding({vertical: 3})]}>
        <Text
          modifiers={[
            frame({width: 16, alignment: 'leading'}),
            font({size: 12, weight: 'medium'}),
            foregroundStyle(secondaryTextColor),
          ]}>
          {rank}.
        </Text>
        <Text
          modifiers={[
            font({size: 12, weight: 'semibold'}),
            foregroundStyle(textColor),
            lineLimit(3),
            minimumScaleFactor(0.8),
          ]}>
          {topic.displayName}
        </Text>
        <Spacer minLength={0} />
      </HStack>
    ) : (
      <HStack
        alignment="top"
        spacing={6}
        modifiers={[padding({vertical: isMedium ? 3 : 7})]}>
        <Text
          modifiers={[
            frame({width: 18, alignment: 'leading'}),
            font({size: 13, weight: 'medium'}),
            foregroundStyle(secondaryTextColor),
          ]}>
          {rank}.
        </Text>
        <VStack alignment="leading" spacing={2}>
          <Text
            modifiers={[
              font({size: isMedium ? 13 : 14, weight: 'semibold'}),
              foregroundStyle(textColor),
              lineLimit(1),
              minimumScaleFactor(0.8),
            ]}>
            {topic.displayName}
          </Text>
          {topic.description ? (
            <Text
              modifiers={[
                font({size: isMedium ? 10 : 11}),
                foregroundStyle(secondaryTextColor),
                lineLimit(2),
              ]}>
              {topic.description}
            </Text>
          ) : null}
        </VStack>
        <Spacer minLength={0} />
      </HStack>
    )

    return isSmall ? row : <Link destination={topic.destination}>{row}</Link>
  }

  return (
    <VStack
      alignment="leading"
      spacing={0}
      modifiers={[
        containerBackground(backgroundColor, 'widget'),
        frame({maxWidth: 1000, maxHeight: 1000, alignment: 'topLeading'}),
        padding({all: isSmall ? 14 : 18}),
        widgetURL(rootDestination),
      ]}>
      <HStack
        spacing={isSmall ? 5 : 6}
        modifiers={[padding({bottom: isSmall ? 2 : 4})]}>
        {/* from the extension's asset catalog, see plugins/withTrendingWidget.js */}
        <Image
          assetName="BlueskyButterfly"
          color="#0085FF"
          modifiers={[
            resizable(),
            frame({width: isSmall ? 12 : 14, height: isSmall ? 12 : 14}),
          ]}
        />
        <Text
          modifiers={[
            font({size: isSmall || isMedium ? 13 : 15, weight: 'bold'}),
            foregroundStyle(textColor),
            lineLimit(1),
          ]}>
          {isSmall
            ? (props.shortTitle ?? 'Trending')
            : (props.title ?? 'Trending on Bluesky')}
        </Text>
        <Spacer minLength={0} />
      </HStack>
      {/* only takes spare room, so wrapped topics still fit on smaller phones */}
      <Spacer minLength={0} modifiers={[frame({maxHeight: isSmall ? 8 : 6})]} />

      {topics.length ? (
        <VStack alignment="leading" spacing={0}>
          {topics.map((topic, index) => (
            <VStack key={topic.destination} alignment="leading" spacing={0}>
              <TopicRow topic={topic} rank={index + 1} />
              {index < topics.length - 1 ? (
                <Divider modifiers={[foregroundStyle(borderColor)]} />
              ) : null}
            </VStack>
          ))}
        </VStack>
      ) : (
        <VStack
          alignment="leading"
          spacing={4}
          modifiers={[padding({top: 12})]}>
          <Text
            modifiers={[
              font({size: 13}),
              foregroundStyle(secondaryTextColor),
              lineLimit(3),
            ]}>
            {props.emptyMessage ?? 'Open Bluesky to load trending topics.'}
          </Text>
          {/* the whole widget opens the app, this just makes that obvious */}
          {props.topics ? null : (
            <Text
              modifiers={[
                font({size: 13, weight: 'semibold'}),
                foregroundStyle('#FFFFFF'),
                padding({horizontal: 14, vertical: 7}),
                background('#0085FF'),
                clipShape('capsule'),
                padding({top: 6}),
              ]}>
              Open Bluesky
            </Text>
          )}
        </VStack>
      )}
    </VStack>
  )
}

export default createWidget('TrendingTopicsWidget', TrendingTopicsWidget, {})

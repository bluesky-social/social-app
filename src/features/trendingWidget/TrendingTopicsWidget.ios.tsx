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
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  minimumScaleFactor,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers'

export type TrendingTopicsWidgetProps = {
  emptyMessage?: string
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
  const rootDestination =
    isSmall && topics[0] ? topics[0].destination : 'https://bsky.app/search'

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
        padding(
          isSmall
            ? {all: 2}
            : isMedium
              ? {horizontal: 10, vertical: 6}
              : {horizontal: 8, vertical: 4},
        ),
        widgetURL(rootDestination),
      ]}>
      {!isSmall ? (
        <HStack spacing={6} modifiers={[padding({bottom: 4})]}>
          <Image
            systemName="chart.line.uptrend.xyaxis"
            size={14}
            color="#0085FF"
          />
          <Text
            modifiers={[
              font({size: isMedium ? 13 : 15, weight: 'bold'}),
              foregroundStyle(textColor),
            ]}>
            {props.title ?? 'Trending on Bluesky'}
          </Text>
          <Spacer minLength={0} />
        </HStack>
      ) : null}

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
        </VStack>
      )}
    </VStack>
  )
}

export default createWidget('TrendingTopicsWidget', TrendingTopicsWidget)

import {createWidget, type WidgetEnvironment} from 'expo-widgets'
import {
  Box,
  Column,
  Image,
  LazyColumn,
  Row,
  Spacer,
  Text,
} from '@expo/ui/jetpack-compose'
import {
  background,
  cornerRadius,
  fillMaxSize,
  fillMaxWidth,
  height,
  padding,
  paddingAll,
  size,
  width,
} from '@expo/ui/jetpack-compose/modifiers'

export type TrendingTopicsWidgetProps = {
  emptyMessage?: string
  title?: string
  topics?: {
    description?: string
    destination: string
    displayName: string
  }[]
}

/*
 * Android only gets `colorScheme` from the environment, not the widget size, so
 * the topics go in a scrolling list that works at any size.
 */
function TrendingTopicsWidget(
  props: TrendingTopicsWidgetProps,
  environment: WidgetEnvironment,
) {
  'use no memo'
  'widget'

  const isDark = environment.colorScheme === 'dark'
  const topics = (props.topics ?? []).slice(0, 5)
  const backgroundColor = isDark ? '#10161F' : '#FFFFFF'
  const textColor = isDark ? '#F1F3F5' : '#0A0A0A'
  const secondaryTextColor = isDark ? '#AEBBC9' : '#536471'
  const borderColor = isDark ? '#2E4052' : '#E5E7EB'

  return (
    <Column
      modifiers={[
        fillMaxSize(),
        cornerRadius(20),
        background(backgroundColor),
        paddingAll(16),
      ]}>
      <Row verticalAlignment="center" modifiers={[padding(0, 0, 0, 6)]}>
        <Image
          source={{uri: 'notification_icon'}}
          tint="#0085FF"
          modifiers={[size(16, 16)]}
        />
        <Spacer modifiers={[width(6)]} />
        <Text
          color={textColor}
          maxLines={1}
          style={{fontSize: 15, fontWeight: 'bold'}}>
          {props.title ?? 'Trending on Bluesky'}
        </Text>
      </Row>

      {topics.length ? (
        <LazyColumn modifiers={[fillMaxSize()]}>
          {topics.map((topic, index) => (
            <Column key={topic.destination} modifiers={[fillMaxWidth()]}>
              <Row modifiers={[fillMaxWidth(), padding(0, 7, 0, 7)]}>
                <Text
                  color={secondaryTextColor}
                  style={{fontSize: 13, fontWeight: '500'}}
                  modifiers={[width(20)]}>
                  {`${index + 1}.`}
                </Text>
                <Column modifiers={[fillMaxWidth()]}>
                  <Text
                    color={textColor}
                    maxLines={1}
                    style={{fontSize: 14, fontWeight: '600'}}>
                    {topic.displayName}
                  </Text>
                  {topic.description ? (
                    <Text
                      color={secondaryTextColor}
                      maxLines={1}
                      style={{fontSize: 12}}>
                      {topic.description}
                    </Text>
                  ) : null}
                </Column>
              </Row>
              {index < topics.length - 1 ? (
                <Box
                  modifiers={[
                    fillMaxWidth(),
                    height(1),
                    background(borderColor),
                  ]}
                />
              ) : null}
            </Column>
          ))}
        </LazyColumn>
      ) : (
        <Text
          color={secondaryTextColor}
          maxLines={3}
          style={{fontSize: 13}}
          modifiers={[padding(0, 12, 0, 0)]}>
          {props.emptyMessage ?? 'Open Bluesky to load trending topics.'}
        </Text>
      )}
    </Column>
  )
}

export default createWidget('TrendingTopicsWidget', TrendingTopicsWidget, {})

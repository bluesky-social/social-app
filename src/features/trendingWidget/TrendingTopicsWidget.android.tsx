import {createWidget, type WidgetEnvironment} from 'expo-widgets'
import {
  Box,
  Button,
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
 * the topics go in a scrolling list that works at any size. Only buttons can be
 * tapped, so anything that opens a link is wrapped in a transparent `Button`
 * (keep its children non-text, or it renders as a Material button).
 */
function TrendingTopicsWidget(
  props: TrendingTopicsWidgetProps,
  environment: WidgetEnvironment,
) {
  'use no memo'
  'widget'

  const isDark = environment.colorScheme === 'dark'
  const topics = props.topics ?? []
  const backgroundColor = isDark ? '#10161F' : '#FFFFFF'
  const textColor = isDark ? '#F1F3F5' : '#0A0A0A'
  const secondaryTextColor = isDark ? '#AEBBC9' : '#536471'
  const borderColor = isDark ? '#2E4052' : '#E5E7EB'
  const rootDestination = 'https://bsky.app/search'

  return (
    <Column
      modifiers={[
        fillMaxSize(),
        cornerRadius(20),
        background(backgroundColor),
        paddingAll(16),
      ]}>
      <Button url={rootDestination} modifiers={[fillMaxWidth()]}>
        <Row
          verticalAlignment="center"
          modifiers={[fillMaxWidth(), padding(0, 0, 0, 6)]}>
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
      </Button>

      {topics.length ? (
        <LazyColumn modifiers={[fillMaxSize()]}>
          {topics.map((topic, index) => (
            <Column key={topic.destination} modifiers={[fillMaxWidth()]}>
              <Button url={topic.destination} modifiers={[fillMaxWidth()]}>
                <Row modifiers={[fillMaxWidth(), padding(0, 5, 0, 5)]}>
                  <Text
                    color={secondaryTextColor}
                    style={{fontSize: 14, fontWeight: '500'}}
                    modifiers={[width(24)]}>
                    {`${index + 1}.`}
                  </Text>
                  <Column modifiers={[fillMaxWidth()]}>
                    <Text
                      color={textColor}
                      style={{fontSize: 14, fontWeight: 'bold'}}>
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
              </Button>
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
        <Button url={rootDestination} modifiers={[fillMaxSize()]}>
          <Column modifiers={[fillMaxSize(), padding(0, 12, 0, 0)]}>
            <Text
              color={secondaryTextColor}
              maxLines={3}
              style={{fontSize: 13}}>
              {props.emptyMessage ?? 'Open Bluesky to load trending topics.'}
            </Text>
            {/* the whole card opens the app, this just makes that obvious */}
            {props.topics ? null : (
              <Column>
                <Spacer modifiers={[height(12)]} />
                <Row
                  modifiers={[
                    cornerRadius(16),
                    background('#0085FF'),
                    padding(14, 7, 14, 7),
                  ]}>
                  <Text
                    color="#FFFFFF"
                    maxLines={1}
                    style={{fontSize: 13, fontWeight: 'bold'}}>
                    Open Bluesky
                  </Text>
                </Row>
              </Column>
            )}
          </Column>
        </Button>
      )}
    </Column>
  )
}

export default createWidget('TrendingTopicsWidget', TrendingTopicsWidget, {})

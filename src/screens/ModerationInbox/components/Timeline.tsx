import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'

import {ContentBlock} from './ContentBlock'
import {TimelineItem} from './TimelineItem'

export function Timeline({items}: {items: {title: string; date?: Date}[]}) {
  const {i18n, t: l} = useLingui()

  return (
    <ContentBlock header={l`Timeline`}>
      <View>
        {items.map(({title, date}, index) => (
          <TimelineItem
            key={index}
            title={title}
            date={
              date
                ? i18n.date(date, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                  })
                : undefined
            }
            last={index + 1 === items.length}
          />
        ))}
      </View>
    </ContentBlock>
  )
}

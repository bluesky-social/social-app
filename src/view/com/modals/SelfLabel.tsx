import React, {useState} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {observer} from 'mobx-react-lite'
import {Text} from '../util/text/Text'
import {useStores} from 'state/index'
import {s, colors} from 'lib/styles'
import {usePalette} from 'lib/hooks/usePalette'
import {isDesktopWeb} from 'platform/detection'
import {Button} from '../util/forms/Button'
import {SelectableBtn} from '../util/forms/SelectableBtn'
import {ScrollView} from 'view/com/modals/util'

const ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn']

export const snapPoints = ['50%']

export const Component = observer(function Component({
  labels,
  hasMedia,
  onChange,
}: {
  labels: string[]
  hasMedia: boolean
  onChange: (labels: string[]) => void
}) {
  const pal = usePalette('default')
  const store = useStores()
  const [selected, setSelected] = useState(labels)

  const toggleAdultLabel = (label: string) => {
    const hadLabel = selected.includes(label)
    const stripped = selected.filter(l => !ADULT_CONTENT_LABELS.includes(l))
    const final = !hadLabel ? stripped.concat([label]) : stripped
    setSelected(final)
    onChange(final)
  }

  const removeAdultLabel = () => {
    const final = selected.filter(l => !ADULT_CONTENT_LABELS.includes(l))
    setSelected(final)
    onChange(final)
  }

  const hasAdultSelection =
    selected.includes('sexual') ||
    selected.includes('nudity') ||
    selected.includes('porn')
  return (
    <View testID="selfLabelModal" style={[pal.view, styles.container]}>
      <View style={styles.titleSection}>
        <Text type="title-lg" style={[pal.text, styles.title]}>
          Add a content warning
        </Text>
      </View>

      <ScrollView>
        <View style={[styles.section, pal.border, {borderBottomWidth: 1}]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 8,
            }}>
            <Text type="title" style={pal.text}>
              Adult Content
            </Text>
            {hasAdultSelection ? (
              <Button
                type="default-light"
                onPress={removeAdultLabel}
                style={{paddingTop: 0, paddingBottom: 0, paddingRight: 0}}>
                <Text type="md" style={pal.link}>
                  Remove
                </Text>
              </Button>
            ) : null}
          </View>
          {hasMedia ? (
            <>
              <View style={s.flexRow}>
                <SelectableBtn
                  testID="sexualLabelBtn"
                  selected={selected.includes('sexual')}
                  left
                  label="Suggestive"
                  onSelect={() => toggleAdultLabel('sexual')}
                  accessibilityHint=""
                  style={s.flex1}
                />
                <SelectableBtn
                  testID="nudityLabelBtn"
                  selected={selected.includes('nudity')}
                  label="Nudity"
                  onSelect={() => toggleAdultLabel('nudity')}
                  accessibilityHint=""
                  style={s.flex1}
                />
                <SelectableBtn
                  testID="pornLabelBtn"
                  selected={selected.includes('porn')}
                  label="Porn"
                  right
                  onSelect={() => toggleAdultLabel('porn')}
                  accessibilityHint=""
                  style={s.flex1}
                />
              </View>

              <Text style={[pal.text, styles.adultExplainer]}>
                {selected.includes('sexual') ? (
                  <>Pictures meant for adults.</>
                ) : selected.includes('nudity') ? (
                  <>Artistic or non-erotic nudity.</>
                ) : selected.includes('porn') ? (
                  <>Sexual activity or erotic nudity.</>
                ) : (
                  <>If none are selected, suitable for all ages.</>
                )}
              </Text>
            </>
          ) : (
            <View>
              <Text style={[pal.textLight]}>
                <Text type="md-bold" style={[pal.textLight]}>
                  Not Applicable
                </Text>
                . This warning is only available for posts with media attached.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.btnContainer, pal.borderDark]}>
        <TouchableOpacity
          testID="confirmBtn"
          onPress={() => {
            store.shell.closeModal()
          }}
          style={styles.btn}
          accessibilityRole="button"
          accessibilityLabel="Confirm"
          accessibilityHint="">
          <Text style={[s.white, s.bold, s.f18]}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isDesktopWeb ? 0 : 40,
  },
  titleSection: {
    paddingTop: isDesktopWeb ? 0 : 4,
    paddingBottom: isDesktopWeb ? 14 : 10,
  },
  title: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  section: {
    borderTopWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: isDesktopWeb ? 0 : 20,
  },
  adultExplainer: {
    paddingLeft: 5,
    paddingTop: 10,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.blue3,
  },
  btnContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
})

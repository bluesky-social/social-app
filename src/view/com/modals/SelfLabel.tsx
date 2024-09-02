import React, {useState} from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useModalControls} from '#/state/modals'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {colors, s} from 'lib/styles'
import {isWeb} from 'platform/detection'
import {ScrollView} from 'view/com/modals/util'
import {Button} from '../util/forms/Button'
import {SelectableBtn} from '../util/forms/SelectableBtn'
import {Text} from '../util/text/Text'

const ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn']

export const snapPoints = ['50%']

export function Component({
  labels,
  hasMedia,
  onChange,
}: {
  labels: string[]
  hasMedia: boolean
  onChange: (labels: string[]) => void
}) {
  const pal = usePalette('default')
  const {closeModal} = useModalControls()
  const {isMobile} = useWebMediaQueries()
  const [selected, setSelected] = useState(labels)
  const {_} = useLingui()

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
          <Trans>Add a content warning</Trans>
        </Text>
      </View>

      <ScrollView>
        <View
          style={[
            styles.section,
            pal.border,
            {borderBottomWidth: 1, paddingHorizontal: isMobile ? 20 : 0},
          ]}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 8,
            }}>
            <Text type="title" style={pal.text}>
              <Trans>Adult Content</Trans>
            </Text>
            {hasAdultSelection ? (
              <Button
                type="default-light"
                onPress={removeAdultLabel}
                style={{paddingTop: 0, paddingBottom: 0, paddingRight: 0}}>
                <Text type="md" style={pal.link}>
                  <Trans>Remove</Trans>
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
                  label={_(msg`Suggestive`)}
                  onSelect={() => toggleAdultLabel('sexual')}
                  accessibilityHint=""
                  style={s.flex1}
                />
                <SelectableBtn
                  testID="nudityLabelBtn"
                  selected={selected.includes('nudity')}
                  label={_(msg`Nudity`)}
                  onSelect={() => toggleAdultLabel('nudity')}
                  accessibilityHint=""
                  style={s.flex1}
                />
                <SelectableBtn
                  testID="pornLabelBtn"
                  selected={selected.includes('porn')}
                  label={_(msg`Porn`)}
                  right
                  onSelect={() => toggleAdultLabel('porn')}
                  accessibilityHint=""
                  style={s.flex1}
                />
              </View>

              <Text style={[pal.text, styles.adultExplainer]}>
                {selected.includes('sexual') ? (
                  <Trans>Pictures meant for adults.</Trans>
                ) : selected.includes('nudity') ? (
                  <Trans>Artistic or non-erotic nudity.</Trans>
                ) : selected.includes('porn') ? (
                  <Trans>Sexual activity or erotic nudity.</Trans>
                ) : (
                  <Trans>If none are selected, suitable for all ages.</Trans>
                )}
              </Text>
            </>
          ) : (
            <View>
              <Text style={[pal.textLight]}>
                <Trans>
                  <Text type="md-bold" style={[pal.textLight]}>
                    Not Applicable.
                  </Text>{' '}
                  This warning is only available for posts with media attached.
                </Trans>
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.btnContainer, pal.borderDark]}>
        <TouchableOpacity
          testID="confirmBtn"
          onPress={() => {
            closeModal()
          }}
          style={styles.btn}
          accessibilityRole="button"
          accessibilityLabel={_(msg`Confirm`)}
          accessibilityHint="">
          <Text style={[s.white, s.bold, s.f18]}>
            <Trans context="action">Done</Trans>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: isWeb ? 0 : 40,
  },
  titleSection: {
    paddingTop: isWeb ? 0 : 4,
    paddingBottom: isWeb ? 14 : 10,
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

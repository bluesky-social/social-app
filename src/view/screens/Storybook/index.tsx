import {lazy, Suspense, useState} from 'react'

import * as Layout from '#/components/Layout'
import {IS_WEB} from '#/env'
import {type Section} from './Storybook'

const Storybook = lazy(() => import('./Storybook'))

export function StorybookScreen() {
  const [section, setSection] = useState<Section | null>(null)

  const goToSection = (next: Section | null) => {
    setSection(next)
    if (IS_WEB) window.scrollTo(0, 0)
  }

  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton
          onPress={evt => {
            if (section) {
              evt.preventDefault()
              goToSection(null)
            }
          }}
        />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            {section ?? 'Storybook'}
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {/* keyed so that each section starts scrolled to the top */}
      <Layout.Content
        key={section ?? 'home'}
        keyboardShouldPersistTaps="handled">
        <Suspense fallback={null}>
          <Storybook section={section} onSelectSection={goToSection} />
        </Suspense>
      </Layout.Content>
    </Layout.Screen>
  )
}

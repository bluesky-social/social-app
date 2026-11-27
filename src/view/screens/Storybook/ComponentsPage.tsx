import {Buttons} from '#/view/screens/Storybook/Buttons'
import {Forms} from '#/view/screens/Storybook/Forms'
import {Links} from '#/view/screens/Storybook/Links'
import {ProfileBadges} from '#/view/screens/Storybook/ProfileBadges'
import {SiteStandardStorybook} from '#/components/atmosphere/SiteStandard/Storybook'
import {GalleryStorybook} from '#/components/Gallery/Storybook'

export default function ComponentsPage() {
  return (
    <>
      <Buttons />
      <Forms />
      <Links />
      <ProfileBadges />
      <GalleryStorybook />
      <SiteStandardStorybook />
    </>
  )
}

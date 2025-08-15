import {Header} from '#/components/Layout'

/**
 * Legacy ViewHeader component. Use Layout.Header going forward.
 *
 * @deprecated use `Layout.Header` from `#/components/Layout.tsx`
 */
export function ViewHeader({
  title,
  renderButton,
}: {
  title: string
  subtitle?: string
  showOnDesktop?: boolean
  showBorder?: boolean
  renderButton?: () => JSX.Element
}) {
  return (
    <Header.Outer>
      <Header.BackButton />
      <Header.Content>
        <Header.TitleText>{title}</Header.TitleText>
      </Header.Content>
      <Header.Slot>{renderButton?.() ?? null}</Header.Slot>
    </Header.Outer>
  )
}

import {Header} from '#/components/Layout'

export function ViewHeader({
  title,
  canGoBack,
  renderButton,
}: {
  title: string
  subtitle?: string
  canGoBack?: boolean
  showOnDesktop?: boolean
  showBorder?: boolean
  renderButton?: () => JSX.Element
}) {
  return (
    <Header.Outer>
      {canGoBack ? <Header.BackButton /> : <Header.MenuButton />}
      <Header.Content>
        <Header.TitleText>{title}</Header.TitleText>
      </Header.Content>
      <Header.Slot>{renderButton?.() ?? null}</Header.Slot>
    </Header.Outer>
  )
}

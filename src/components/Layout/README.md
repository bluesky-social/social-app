# Layout

This directory contains our core layout components. Use these when creating new
screens, or when supplementing other components with functionality like
centering.

## Usage

If we aren't talking about the `shell` components, layouts on individual screens
look like more or less like this:

```tsx
<Outer>
  <Header>...</Header>
  <Content>...</Content>
</Outer>
```

I'll map these words to real components.

### `Layout.Screen`

Provides the "Outer" functionality for a screen, like taking up the full height
of the screen. **All screens should be wrapped with this component,** probably
as the outermost component.

> [!NOTE]
> On web, `Layout.Screen` also provides the side borders on our central content
> column. These borders are fixed position, 1px outside our center column width
> of 600px.
>
> What this effectively means is that _nothing inside the center content column
> needs (or should) define left/right borders._ That is now handled in one
> place: within `Layout.Screen`.

### `Layout.Header.*`

The `Layout.Header` component actually contains multiple sub-components. Use
this to compose different versions of the header. The most basic version looks
like this:

```tsx
<Layout.Header.Outer>
  <Layout.Header.BackButton /> {/* or <Layout.Header.MenuButton /> */}

  <Layout.Header.Content>
    <Layout.Header.TitleText>Account</Layout.Header.TitleText>

    {/* Optional subtitle */}
    <Layout.Header.SubtitleText>Settings for @esb.lol</Layout.Header.SubtitleText>
  </Layout.Header.Content>

  <Layout.Header.Slot />
</Layout.Header.Outer>
```

Note the additional `Slot` component. This is here to keep the header balanced
and provide correct spacing on all platforms. The `Slot` is 34px wide, which
matches the `BackButton` and `MenuButton`.

> If anyone has better ideas, I'm all ears, but this was simple and the small
> amount of boilerplate is only incurred when creating a new screen, which is
> infrequent.

It can also function as a "slot" for a button positioned on the right side. See
the `Hashtag` screen for an example, abbreviated below:

```tsx
<Layout.Header.Slot>
  <Button size='small' shape='round'>...</Button>
</Layout.Header.Slot>
```

If you need additional customization, simply use the components that are helpful
and create new ones as needed. A good example is the `SavedFeeds` screen, which
looks roughly like this:

```tsx
<Layout.Header.Outer>
  <Layout.Header.BackButton />

  {/* Override to align content to the left, making room for the button */}
  <Layout.Header.Content align='left'>
    <Layout.Header.TitleText>Edit My Feeds</Layout.Header.TitleText>
  </Layout.Header.Content>

  {/* Custom button, wider than 34px */}
  <Button size='small'>...</Button>
</Layout.Header.Outer>
```

> [!TIP]
> The `Header` should be _outside_ the `Content` component in order to be
> fixed on scroll on native. Placing it inside will make it scroll with the rest
> of the page.

### `Layout.Content`

This provides the "Content" functionality for a screen. This component is
actually an `Animated.ScrollView`, and accepts props for that component. It
provides a little default styling as well. On web, it also _centers the content
inside our center content column of 600px_.

> [!NOTE]
> What about flatlists or pagers? Those components are not colocated here (yet).
> But those components serve the same purpose of "Content".

## Examples

The most basic layout available to us looks like this:

```tsx
<Layout.Screen>
  <Layout.Header.Outer>
    <Layout.Header.BackButton /> {/* or <Layout.Header.MenuButton /> */}

    <Layout.Header.Content>
      <Layout.Header.TitleText>Account</Layout.Header.TitleText>

      {/* Optional subtitle */}
      <Layout.Header.SubtitleText>Settings for @esb.lol</Layout.Header.SubtitleText>
    </Layout.Header.Content>

    <Layout.Header.Slot />
  </Layout.Header.Outer>

  <Layout.Content>
    ...
  </Layout.Content>
</Layout.Screen>
```

**For `List` views,** you'd sub in `List` for `Layout.Content` and it will
function the same. See `Feeds` screen for an example.

**For `Pager` views,** including `PagerWithHeader`, do the same. See `Hashtag`
screen for an example.

## Utilities

### `Layout.Center`

This component behaves like our old `CenteredView` component.

### `Layout.SCROLLBAR_OFFSET` and `Layout.SCROLLBAR_OFFSET_POSITIVE`

Provide a pre-configured CSS vars for use when aligning fixed position elements.
More on this below.

## Scrollbar gutter handling

Operating systems allow users to configure if their browser _always_ shows
scrollbars not. Some OSs also don't allow configuration.

The presence of scrollbars affects layout, particularly fixed position elements.
Browsers support `scrollbar-gutter`, but each behaves differently. Our approach
is to use the default `scrollbar-gutter: auto`. Basically, we start from a clean
slate.

This handling becomes particularly thorny when we need to lock scroll, like when
opening a dialog or dropdown. Radix uses the library `react-remove-scroll`
internally, which in turn depends on
[`react-remove-scroll-bar`](https://github.com/theKashey/react-remove-scroll-bar).
We've opted to rely on this transient dependency. This library adds some utility
classes and CSS vars to the page when scroll is locked.

**It is this CSS variable that we use in `SCROLLBAR_OFFSET` values.** This
ensures that elements do not shift relative to the screen when opening a
dropdown or dialog.

These styles are applied where needed and we should have very little need of
adjusting them often.

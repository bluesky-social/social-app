# Global Dialogs

The dialogs and utils contained in this directory are intended to be "global" in
the sense that they are very common.

A good example: the report dialog. We need to be able to open one from every
post, but if every post had its own `Dialog`, performance would suffer.
Previously the solution was to use the same modal/sheet via `Modal`, and just
swap out the content.

The solution here is to only render the dialog when it's opened, and to enable
programmatic opening of said dialog e.g. from a context menu.

**For other dialogs that can be rendered _in situ_, use `Dialog` directly.**
Only use this abstraction for instances that either aren't possible or would be
performance intensive when defining a `Dialog` in situ.

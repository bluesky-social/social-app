/**
 * This TypeScript function merges multiple React refs into a single ref callback.
 * When developing low level UI components, it is common to have to use a local ref
 * but also support an external one using React.forwardRef.
 * Natively, React does not offer a way to set two refs inside the ref property. This is the goal of this small utility.
 * Today a ref can be a function or an object, tomorrow it could be another thing, who knows.
 * This utility handles compatibility for you.
 * This function is inspired by https://github.com/gregberge/react-merge-refs
 * @param refs - An array of React refs, which can be either `React.MutableRefObject<T>` or
 * `React.LegacyRef<T>`. These refs are used to store references to DOM elements or React components.
 * The `mergeRefs` function takes in an array of these refs and returns a callback function that
 * @returns The function `mergeRefs` is being returned. It takes an array of mutable or legacy refs and
 * returns a ref callback function that can be used to merge multiple refs into a single ref.
 */
export function mergeRefs<T = any>(
  refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>,
): React.RefCallback<T> {
  return value => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(value)
      } else if (ref != null) {
        ;(ref as React.MutableRefObject<T | null>).current = value
      }
    })
  }
}

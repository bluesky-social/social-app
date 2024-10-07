// It should roll when:
// - We're going from 1 to 0 (roll backwards)
// - The count is anywhere between 1 and 999
// - The count is going up and is a multiple of 100
// - The count is going down and is 1 less than a multiple of 100
export function decideShouldRoll(isSet: boolean, count: number) {
  let shouldRoll = false
  if (!isSet && count === 1) {
    shouldRoll = true
  } else if (count > 1 && count < 1000) {
    shouldRoll = true
  } else if (count > 0) {
    const mod = count % 100
    if (isSet && mod === 0) {
      shouldRoll = true
    } else if (!isSet && mod === 99) {
      shouldRoll = true
    }
  }
  return shouldRoll
}

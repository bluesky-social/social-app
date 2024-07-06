export const Text = createClientReference('Text')
export const ActorLabel = createClientReference('ActorLabel')
export const Avatar = createClientReference('Avatar')
export const Box = createClientReference('Box')
export const Embed = createClientReference('Embed')
export const Expandable = createClientReference('Expandable')
export const Label = createClientReference('Label')
export const Stack = createClientReference('Stack')
export const Tabs = createClientReference('Tabs')

function createClientReference(id) {
  return {
    $$typeof: Symbol.for('react.client.reference'),
    $$id: id,
  }
}

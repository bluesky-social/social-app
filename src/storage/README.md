# `#/storage`

## Usage

Import the correctly scoped store from `#/storage`. Each instance of `Storage`
(the base class, not to be used directly), has the following interface:

- `set([...scope, key], value)`
- `get([...scope, key])`
- `remove([...scope, key])`
- `removeMany([...scope], [...keys])`

For example, using our `device` store looks like this, since it's scoped to the
device (the most base level scope):

```typescript
import { device } from '#/storage';

device.set(['foobar'], true);
device.get(['foobar']);
device.remove(['foobar']);
device.removeMany([], ['foobar']);
```

## TypeScript

Stores are strongly typed, and when setting a given value, it will need to
conform to the schemas defined in `#/storage/schema`. When getting a value, it
will be returned to you as the type defined in its schema.

## Scoped Stores

Some stores are (or might be) scoped to an account or other identifier. In this
case, storage instances are created with type-guards, like this:

```typescript
type AccountSchema = {
  language: `${string}-${string}`;
};

type DID = `did:${string}`;

const account = new Storage<
  [DID],
  AccountSchema
>({
  id: 'account',
});

account.set(
  ['did:plc:abc', 'language'],
  'en-US',
);

const language = account.get([
  'did:plc:abc',
  'language',
]);
```

Here, if `['did:plc:abc']` is not supplied along with the key of
`language`, the `get` will return undefined (and TS will yell at you).

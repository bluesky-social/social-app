# `#/storage`

Strongly typed storage interface over `AsyncStorage`.

## Usage

Import the correctly scoped store from `#/storage`. Each instance of `Storage`
(the base class, not to be used directly), has the following interface:

- `set([...scope, key], value)`
- `get([...scope, key])`
- `remove([...scope, key])`
- `removeMany([...scope], [...keys])`

For example, using our `storage` global store looks like this, since it's scoped to the
device and not an account:

```typescript
import * as storage from '#/storage';

storage.device.set(['colorScheme'], 'light');
storage.device.get(['colorScheme']);
storage.device.remove(['colorScheme']);
storage.device.removeMany([], ['colorScheme']);
```

### Storing Objects

Because of the way `Storage` serializes data for storage, you don't need to
pre-serialize objects or any other type of data.

```typescript
storage.device.set(['foo'], true)
storage.device.get(['foo']) // => boolean

storage.device.set(['bar'], 1)
storage.device.get(['bar']) // => number

storage.device.set(['baz'], { yes: true })
storage.device.get(['baz']) // => object { yes: true }
```

## TypeScript

Stores are strongly typed, and when setting a given value, it will need to
conform to the schemas defined in `#/storage/schemas`. When getting a value, it
will be returned to you as the type defined in its schema.

## Scoped Stores

Some stores are (will be) scoped to account. In this case, storage instances are
created with type-guards, like this:

```typescript
type Account = {
  initialView: string
};

type DID = `did:plc:${string}`;

const account = new Storage<
  [DID],
  Account
>({
  initialView: 'following',
});
```

```typescript
import * as storage from '#/storage'

storage.account.set(['did:plc:123abc', 'initialView'], 'following')
storage.account.get(['did:plc:123abc', 'initialView'])
```

Here, if `['did:plc:123abc']` is not supplied along with the storage key of
`initialView`, type checking will fail, and the value will return undefined at
runtime.

## Extensibility

For storage instances that require scopes like `account`, it may be useful in
the future to define wrappers around `Storage` that can cache references to the
currently active account. That way, we don't have to pass in the `DID` every
time.

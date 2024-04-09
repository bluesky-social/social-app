import {Key, Keyset} from '#/oauth-client-temp/jwk'
import {Importable, JoseKey} from './jose-key'

export class JoseKeyset<K extends Key = Key> extends Keyset<K> {
  static async fromImportables<K extends Key = JoseKey>(
    input: Record<string, K | Importable>,
  ) {
    return new JoseKeyset(
      await Promise.all(
        Object.entries(input).map(([kid, secret]) =>
          secret instanceof Key ? secret : JoseKey.fromImportable(secret, kid),
        ),
      ),
    )
  }
}

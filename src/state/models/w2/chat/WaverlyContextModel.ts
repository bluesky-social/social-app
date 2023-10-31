import {RootStoreModel} from 'state/index'
import {makeAutoObservable} from 'mobx'
import {PickableData} from 'view/com/w2/web-reader/DraggableFab'

export class WaverlyContextModel {
  context: Map<string, any> = new Map<string, any>()
  pd: PickableData | undefined = undefined

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {rootStore: false}, {autoBind: true})
  }
  set(key: string, data: any) {
    //console.log('===== context set: ', key, !data ? 'undefined' : 'defined')
    this.context.set(key, data)
  }
  get(key: string) {
    return this.context.get(key)
  }
  setPickableData(v: PickableData | undefined) {
    this.pd = v
  }
}

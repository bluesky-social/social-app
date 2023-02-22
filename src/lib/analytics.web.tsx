// TODO
import React from 'react'
import {RootStoreModel} from 'state/models/root-store'

export function useAnalytics() {
  return {
    screen(_name: string) {},
    track(_name: string, _opts: any) {},
  }
}

export function init(_store: RootStoreModel) {}

export function Provider({children}: React.PropsWithChildren<{}>) {
  return children
}

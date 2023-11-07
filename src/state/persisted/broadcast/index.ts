export default class BroadcastChannel {
  constructor(public name: string) {}
  postMessage(_data: any) {}
  close() {}
  onmessage: (event: MessageEvent) => void = () => {}
}

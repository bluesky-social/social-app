import {LogModel} from '../../../src/state/models/log'

describe('LogModel', () => {
  let logModel: LogModel

  beforeEach(() => {
    logModel = new LogModel()
    jest.spyOn(console, 'debug')
  })

  afterAll(() => {
    jest.clearAllMocks()
  })

  it('should call a log method and add a log entry to the entries array', () => {
    logModel.debug('Test log')
    expect(logModel.entries.length).toEqual(1)
    expect(logModel.entries[0]).toEqual({
      id: logModel.entries[0].id,
      type: 'debug',
      summary: 'Test log',
      details: undefined,
      ts: logModel.entries[0].ts,
    })

    logModel.warn('Test log')
    expect(logModel.entries.length).toEqual(2)
    expect(logModel.entries[1]).toEqual({
      id: logModel.entries[1].id,
      type: 'warn',
      summary: 'Test log',
      details: undefined,
      ts: logModel.entries[1].ts,
    })

    logModel.error('Test log')
    expect(logModel.entries.length).toEqual(3)
    expect(logModel.entries[2]).toEqual({
      id: logModel.entries[2].id,
      type: 'error',
      summary: 'Test log',
      details: undefined,
      ts: logModel.entries[2].ts,
    })
  })

  it('should call the console.debug after calling the debug method', () => {
    logModel.debug('Test log')
    expect(console.debug).toHaveBeenCalledWith('Test log', '')
  })

  it('should call the serialize method', () => {
    logModel.debug('Test log')
    expect(logModel.serialize()).toEqual({
      entries: [
        {
          id: logModel.entries[0].id,
          type: 'debug',
          summary: 'Test log',
          details: undefined,
          ts: logModel.entries[0].ts,
        },
      ],
    })
  })

  it('should call the hydrate method with valid properties', () => {
    logModel.hydrate({
      entries: [
        {
          id: '123',
          type: 'debug',
          summary: 'Test log',
          details: undefined,
          ts: 123,
        },
      ],
    })
    expect(logModel.entries).toEqual([
      {
        id: '123',
        type: 'debug',
        summary: 'Test log',
        details: undefined,
        ts: 123,
      },
    ])
  })

  it('should call the hydrate method with invalid properties', () => {
    logModel.hydrate({
      entries: [
        {
          id: '123',
          type: 'debug',
          summary: 'Test log',
          details: undefined,
          ts: 123,
        },
        {
          summary: 'Invalid entry',
        },
      ],
    })
    expect(logModel.entries).toEqual([
      {
        id: '123',
        type: 'debug',
        summary: 'Test log',
        details: undefined,
        ts: 123,
      },
    ])
  })

  it('should stringify the details if it is not a string', () => {
    logModel.debug('Test log', {details: 'test'})
    expect(logModel.entries[0].details).toEqual('{\n  "details": "test"\n}')
  })

  it('should stringify the details object if it is of a specific error', () => {
    class TestError extends Error {
      constructor() {
        super()
        this.name = 'TestError'
      }
    }
    const error = new TestError()
    logModel.error('Test error log', error)
    expect(logModel.entries[0].details).toEqual('TestError')

    class XRPCInvalidResponseErrorMock {
      validationError = {toString: () => 'validationError'}
      lexiconNsid = 'test'
    }
    const xrpcInvalidResponseError = new XRPCInvalidResponseErrorMock()
    logModel.error('Test error log', xrpcInvalidResponseError)
    expect(logModel.entries[1].details).toEqual(
      '{\n  "validationError": {},\n  "lexiconNsid": "test"\n}',
    )

    class XRPCErrorMock {
      status = 'status'
      error = 'error'
      message = 'message'
    }
    const xrpcError = new XRPCErrorMock()
    logModel.error('Test error log', xrpcError)
    expect(logModel.entries[2].details).toEqual(
      '{\n  "status": "status",\n  "error": "error",\n  "message": "message"\n}',
    )
  })
})

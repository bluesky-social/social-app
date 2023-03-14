import {makeAutoObservable} from 'mobx'
import {RootStoreModel} from '../root-store'
import {ServiceDescription} from '../session'
import {DEFAULT_SERVICE} from 'state/index'
import {ComAtprotoAccountCreate} from '@atproto/api'
import * as EmailValidator from 'email-validator'
import {createFullHandle} from 'lib/strings/handles'
import {cleanError} from 'lib/strings/errors'

export class CreateAccountModel {
  step: number = 1
  isProcessing = false
  isFetchingServiceDescription = false
  didServiceDescriptionFetchFail = false
  error = ''

  serviceUrl = DEFAULT_SERVICE
  serviceDescription: ServiceDescription | undefined = undefined
  userDomain = ''
  inviteCode = ''
  email = ''
  password = ''
  handle = ''
  is13 = false

  constructor(public rootStore: RootStoreModel) {
    makeAutoObservable(this, {}, {autoBind: true})
  }

  // form state controls
  // =

  next() {
    this.error = ''
    this.step++
  }

  back() {
    this.error = ''
    this.step--
  }

  setStep(v: number) {
    this.step = v
  }

  async fetchServiceDescription() {
    this.setError('')
    this.setIsFetchingServiceDescription(true)
    this.setDidServiceDescriptionFetchFail(false)
    this.setServiceDescription(undefined)
    if (!this.serviceUrl) {
      return
    }
    try {
      const desc = await this.rootStore.session.describeService(this.serviceUrl)
      this.setServiceDescription(desc)
      this.setUserDomain(desc.availableUserDomains[0])
    } catch (err: any) {
      this.rootStore.log.warn(
        `Failed to fetch service description for ${this.serviceUrl}`,
        err,
      )
      this.setError(
        'Unable to contact your service. Please check your Internet connection.',
      )
      this.setDidServiceDescriptionFetchFail(true)
    } finally {
      this.setIsFetchingServiceDescription(false)
    }
  }

  async submit() {
    if (!this.email) {
      this.setStep(2)
      return this.setError('Please enter your email.')
    }
    if (!EmailValidator.validate(this.email)) {
      this.setStep(2)
      return this.setError('Your email appears to be invalid.')
    }
    if (!this.password) {
      this.setStep(2)
      return this.setError('Please choose your password.')
    }
    if (!this.handle) {
      this.setStep(3)
      return this.setError('Please choose your handle.')
    }
    this.setError('')
    this.setIsProcessing(true)
    try {
      await this.rootStore.session.createAccount({
        service: this.serviceUrl,
        email: this.email,
        handle: createFullHandle(this.handle, this.userDomain),
        password: this.password,
        inviteCode: this.inviteCode,
      })
    } catch (e: any) {
      let errMsg = e.toString()
      if (e instanceof ComAtprotoAccountCreate.InvalidInviteCodeError) {
        errMsg =
          'Invite code not accepted. Check that you input it correctly and try again.'
      }
      this.rootStore.log.error('Failed to create account', e)
      this.setIsProcessing(false)
      this.setError(cleanError(errMsg))
      throw e
    }
  }

  // form state accessors
  // =

  get canBack() {
    return this.step > 1
  }

  get canNext() {
    if (this.step === 1) {
      return !!this.serviceDescription
    } else if (this.step === 2) {
      return (
        (!this.isInviteCodeRequired || this.inviteCode) &&
        !!this.email &&
        !!this.password &&
        this.is13
      )
    }
    return !!this.handle
  }

  get isServiceDescribed() {
    return !!this.serviceDescription
  }

  get isInviteCodeRequired() {
    return this.serviceDescription?.inviteCodeRequired
  }

  // setters
  // =

  setIsProcessing(v: boolean) {
    this.isProcessing = v
  }

  setIsFetchingServiceDescription(v: boolean) {
    this.isFetchingServiceDescription = v
  }

  setDidServiceDescriptionFetchFail(v: boolean) {
    this.didServiceDescriptionFetchFail = v
  }

  setError(v: string) {
    this.error = v
  }

  setServiceUrl(v: string) {
    this.serviceUrl = v
  }

  setServiceDescription(v: ServiceDescription | undefined) {
    this.serviceDescription = v
  }

  setUserDomain(v: string) {
    this.userDomain = v
  }

  setInviteCode(v: string) {
    this.inviteCode = v
  }

  setEmail(v: string) {
    this.email = v
  }

  setPassword(v: string) {
    this.password = v
  }

  setHandle(v: string) {
    this.handle = v
  }

  setIs13(v: boolean) {
    this.is13 = v
  }
}

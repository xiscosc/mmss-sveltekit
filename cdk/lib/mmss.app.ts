import { App } from 'aws-cdk-lib'
import { MmSsStack } from './mmss.stack'

export class MmSsApp extends App {
  constructor() {
    super()

    const props = {
      envName: MmSsApp.getFromEnv('CDK_ENV_NAME'),
    }

    new MmSsStack(this, `${props.envName}-mmss-stack`, props)
  }

  private static getFromEnv(key: string): string {
    if (process.env[key] !== undefined) {
      return process.env[key]!
    }

    throw Error(`Undefined env ${key}`)
  }
}

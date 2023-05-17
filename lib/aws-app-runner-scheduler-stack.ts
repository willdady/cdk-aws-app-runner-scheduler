import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AwsAppRunnerScheduler } from './aws-app-runner-scheduler';

export class AwsAppRunnerSchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new AwsAppRunnerScheduler(this, 'ExampleScheduler', {
      serviceTag: {
        key: 'environment',
        value: 'development',
      },
      pauseCronOptions: {
        hour: '2',
        minute: '0',
      },
      resumeCronOptions: {
        hour: '21',
        minute: '0',
      },
    });
  }
}

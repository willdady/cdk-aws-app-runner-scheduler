import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AwsAppRunnerScheduler } from './aws-app-runner-scheduler';

export class AwsAppRunnerSchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new AwsAppRunnerScheduler(this, 'ProjectAcmeScheduler', {
      serviceTag: {
        key: 'project',
        value: 'acme',
      },
      pauseCronOptions: {
        hour: '2',
      },
      resumeCronOptions: {
        hour: '21',
      },
    });
  }
}

import { Construct } from 'constructs';
import * as path from 'path';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambdaNodeJS from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface AwsAppRunnerSchedulerProps {
  serviceTag: {
    key: string;
    value: string;
  };
  pauseCronOptions: events.CronOptions;
  resumeCronOptions: events.CronOptions;
}

export class AwsAppRunnerScheduler extends Construct {
  public servicePauserFunction: lambdaNodeJS.NodejsFunction;
  public serviceResumerFunction: lambdaNodeJS.NodejsFunction;
  public pauseRule: events.Rule;
  public resumeRule: events.Rule;

  constructor(scope: Construct, id: string, props: AwsAppRunnerSchedulerProps) {
    super(scope, id);

    this.servicePauserFunction = new lambdaNodeJS.NodejsFunction(
      this,
      'AppRunnerServicePauserFunction',
      {
        entry: path.join(__dirname, 'lambda', `app-runner-service-pauser.ts`),
        environment: {
          SERVICE_TAG_KEY: props.serviceTag.key,
          SERVICE_TAG_VALUE: props.serviceTag.value,
        },
      },
    );
    this.servicePauserFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'apprunner:ListServices',
          'apprunner:ListTagsForResource',
          'apprunner:PauseService',
        ],
      }),
    );

    this.serviceResumerFunction = new lambdaNodeJS.NodejsFunction(
      this,
      'AppRunnerServiceResumerFunction',
      {
        entry: path.join(__dirname, 'lambda', `app-runner-service-resumer.ts`),
        environment: {
          SERVICE_TAG_KEY: props.serviceTag.key,
          SERVICE_TAG_VALUE: props.serviceTag.value,
        },
      },
    );
    this.serviceResumerFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'apprunner:ListServices',
          'apprunner:ListTagsForResource',
          'apprunner:ResumeService',
        ],
      }),
    );

    this.pauseRule = new events.Rule(this, 'AppRunnerServicePauseRule', {
      schedule: events.Schedule.cron(props.pauseCronOptions),
      targets: [new targets.LambdaFunction(this.servicePauserFunction)],
    });

    this.resumeRule = new events.Rule(this, 'AppRunnerServiceResumeRule', {
      schedule: events.Schedule.cron(props.resumeCronOptions),
      targets: [new targets.LambdaFunction(this.serviceResumerFunction)],
    });
  }
}

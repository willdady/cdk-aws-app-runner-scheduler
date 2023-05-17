# CDK AWS App Runner Scheduler

A reference AWS CDK application for scheduling the pausing and resuming of AWS App Runner services.
Useful for dev environments where you want to pause AWS App Runner services out-of-hours to save money.

## Setup

Install dependencies.
Requires Node.js >= v16

```
npm install
```

## Deployment

```
npm run cdk -- deploy AwsAppRunnerScheduler
```

## Usage

This project defines `AwsAppRunnerScheduler`, a custom CDK construct which pauses/resumes any AWS App Runner services matching the provided tag on the provided schedule.

For example, the following will pause ALL AWS App Runner services tagged with key `environment` and value `development` at 02:00 UTC and resume the service at 21:00 UTC daily. 

```typescript
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
```

Note, cron options are in **UTC time** *not* your local time.
Also, `serviceTag.key` and `serviceTag.value` are **case-sensitive**.
# CDK AWS App Runner Scheduler

A reference AWS CDK application for scheduling the pausing and resuming of AWS App Runner services.
Useful for dev environments where you want to pause services out-of-hours to save money.

## Setup

Install dependencies.
Requires Node.js >= v16

```
npm install
```

## Deployment

```
npm run cdk -- deploy AwsAppRunnerSchedulerStack
```

## Usage

TODO

```typescript
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
```
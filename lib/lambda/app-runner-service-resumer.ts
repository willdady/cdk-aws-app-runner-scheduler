import {
  AppRunnerClient,
  ListTagsForResourceCommand,
  ResumeServiceCommand,
  paginateListServices,
} from '@aws-sdk/client-apprunner';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const { SERVICE_TAG_KEY, SERVICE_TAG_VALUE, SNS_TOPIC_ARN } = process.env;

const arClient = new AppRunnerClient({});
const snsClient = new SNSClient({});

export const handler = async () => {
  const servicesPaginator = paginateListServices({ client: arClient }, {});
  for await (const page of servicesPaginator) {
    for (const service of page.ServiceSummaryList || []) {
      log(`Listing tags on AWS App Runner service '${service.ServiceArn!}'`);
      const tags = await getServiceTags(service.ServiceArn!);
      log(
        `Found ${
          tags.length
        } tags on AWS App Runner service '${service.ServiceArn!}'`,
      );
      for (const tag of tags) {
        try {
          if (tag.Key === SERVICE_TAG_KEY && tag.Value === SERVICE_TAG_VALUE) {
            if (service.Status !== 'PAUSED') {
              throw new Error(
                `Can not resume AWS App Runner service '${service.ServiceArn}' because it's status is not 'PAUSED'. Current status is '${service.Status}'.`,
              );
            }
            log(`Resuming AWS App Runner service '${service.ServiceArn}'`);
            await resumeService(service.ServiceArn!);
            if (SNS_TOPIC_ARN) {
              log(
                `Publishing status change message to SNS topic '${SNS_TOPIC_ARN}'`,
              );
              await publishSnsMessage({
                serviceArn: service.ServiceArn!,
                status: 'RUNNING',
              });
            }
            continue;
          }
        } catch (error) {
          err((error as Error).message);
        }
      }
    }
  }
};

const getServiceTags = async (serviceArn: string) => {
  const { Tags } = await arClient.send(
    new ListTagsForResourceCommand({
      ResourceArn: serviceArn,
    }),
  );
  return Tags || [];
};

const resumeService = async (serviceArn: string) => {
  await arClient.send(new ResumeServiceCommand({ ServiceArn: serviceArn }));
};

const log = (message: string) => {
  return console.log(JSON.stringify({ message }));
};

const err = (message: string) => {
  return console.error(JSON.stringify({ message }));
};

const publishSnsMessage = ({
  status,
  serviceArn,
}: {
  status: string;
  serviceArn: string;
}) => {
  return snsClient.send(
    new PublishCommand({
      TopicArn: SNS_TOPIC_ARN!,
      Subject: `AWS App Runner service status change - ${status}`,
      Message: [
        `AWS App Runner service with ARN '${serviceArn}' has had a scheduled status change.`,
        `The new status is ${status}`,
      ].join(' '),
    }),
  );
};

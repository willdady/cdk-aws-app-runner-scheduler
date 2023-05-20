import {
  AppRunnerClient,
  ListTagsForResourceCommand,
  PauseServiceCommand,
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
            if (service.Status !== 'RUNNING') {
              throw new Error(
                `Can not pause AWS App Runner service '${service.ServiceArn}' because it's status is not 'RUNNING'. Current status is '${service.Status}'.`,
              );
            }
            log(`Pausing AWS App Runner service '${service.ServiceArn}'`);
            await pauseService(service.ServiceArn!);
            if (SNS_TOPIC_ARN) {
              log(
                `Publishing status change message to SNS topic '${SNS_TOPIC_ARN}'`,
              );
              await publishSnsMessage({
                serviceArn: service.ServiceArn!,
                status: 'PAUSED',
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

const pauseService = async (serviceArn: string) => {
  await arClient.send(new PauseServiceCommand({ ServiceArn: serviceArn }));
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
      Subject: `AWS App Runner service '${serviceArn}' status change - ${status}`,
      Message: [
        `AWS App Runner service witn ARN '${serviceArn}' has had a scheduled status change.`,
        `The new status is ${status}`,
      ].join(' '),
    }),
  );
};

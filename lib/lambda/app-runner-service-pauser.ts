import {
  AppRunnerClient,
  ListTagsForResourceCommand,
  PauseServiceCommand,
  paginateListServices,
} from '@aws-sdk/client-apprunner';

const { SERVICE_TAG_KEY, SERVICE_TAG_VALUE } = process.env;

const arClient = new AppRunnerClient({});

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
                `Can not pause AWS App Runner service '${service.ServiceArn}' because it is not running`,
              );
            }
            log(`Pausing AWS App Runner service '${service.ServiceArn}'`);
            await pauseService(service.ServiceArn!);
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

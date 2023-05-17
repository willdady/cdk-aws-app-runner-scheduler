import {
  AppRunnerClient,
  ListTagsForResourceCommand,
  ResumeServiceCommand,
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
            if (service.Status !== 'PAUSED') {
              throw new Error(
                `Can not resume AWS App Runner service '${service.ServiceArn}' because it's status is not 'PAUSED'. Current status is '${service.Status}'.`,
              );
            }
            log(`Resuming AWS App Runner service '${service.ServiceArn}'`);
            await resumeService(service.ServiceArn!);
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

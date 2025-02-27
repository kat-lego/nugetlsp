import axios, { AxiosResponse } from "axios";
import winston from 'winston'
import { PackageMetaData, PackageVersion, Vulnerability } from "../models/packagemeta";

export async function getPackageMetadata(packageName: string,
  targetFramework: string,
  logger: winston.Logger)
  : Promise<PackageMetaData | undefined> {

  logger.info(`[GET_PACKAGE_METADATA | ${packageName} ]`);

  if (!packageName) return undefined;

  const feeds = ["https://api.nuget.org"];
  const baseUrls = await getResourceUrls('RegistrationsBaseUrl/3.6.0', feeds, logger);

  logger.info(`[GET_PACKAGE_METADATA | ${packageName} ] Resources: ${JSON.stringify(baseUrls, null, 2)}`);

  const urls = baseUrls.map(u => `${u}${packageName.toLowerCase()}/index.json`);

  const response = await getFirstSuccessful(urls);
  if (!response) {
    logger.error(`[GET_PACKAGE_METADATA | ${packageName} ] Unable to find package named ${packageName} from
sources feeds`)
    return undefined;
  }

  const nugPackageMetadata: PackageMetaData = {
    packageName: packageName,
    versions: []
  };

  const nugetRes = response.data as NugetRegistrationResponse;
  const pages = nugetRes?.items ?? [];

  for (let p of pages) {
    for (let item of p?.items ?? []) {
      if (item["@type"] !== "Package" || item.catalogEntry.id.toLowerCase() === "") {
        continue;
      }

      const dependencyGroups = item.catalogEntry.dependencyGroups ?? []
      const deps = dependencyGroups.find(x => {
        return x?.targetFramework?.toLowerCase() == targetFramework.toLowerCase()
      })?.dependencies ?? []

      const version: PackageVersion = {
        authors: item.catalogEntry.authors,
        version: item.catalogEntry.version,
        description: item.catalogEntry.description,
        tags: item.catalogEntry.tags,
        dependencies: deps.filter(x => x["@type"] === "PackageDependency").map(x => {
          return { packageName: x.id, versionRange: x.range }
        }),
        vulnerabilities: item.catalogEntry.vulnerabilities?.map(v => {
          return { advisoryUrl: v.advisoryUrl, severity: v.severity }
        }) ?? []
      }

      nugPackageMetadata.versions.push(version);

    }
  }

  nugPackageMetadata.versions.reverse();

  return nugPackageMetadata;
}

export async function autoCompleteSearch(packageName: string, logger: winston.Logger)
  : Promise<Array<string>> {

  logger.info(`Auto complete search for package ${packageName}`)

  if (!packageName) return [];

  const feeds = ["https://api.nuget.org"];
  const baseUrls = await getResourceUrls('SearchAutocompleteService/3.5.0', feeds, logger);
  const queryParams = new URLSearchParams({
    q: packageName,
    semVerLevel: '2.0.0',
    sortBy: 'relevance',
    packageType: 'Dependency'
  });

  const urls = baseUrls.map(u => `${u}?${queryParams.toString()}`);
  const response = await getFirstSuccessful(urls);
  if (!response) {
    logger.error(`Unable to find package named ${packageName} from sources ${JSON.stringify(feeds)}`)
    return [];
  }

  return response.data.data as Array<string>
}

async function getResourceUrls(
  resource: string,
  nugetFeeds: Array<string>,
  logger: winston.Logger): Promise<Array<string>> {

  logger.info(`[GET_RESOURCE_URLS | ${resource}]`)

  const responsePromiseResults = await Promise.allSettled(nugetFeeds.map(x => {
    logger.info(`[GET_RESOURCE_URLS | ${resource}] Requesting resource from feed ${x}/v3/index.json`);
    return axios.get(`${x}/v3/index.json`, { validateStatus: () => true });
  }));

  const urls = responsePromiseResults
    .map((x, i) => {
      if (x.status !== "fulfilled") {
        logger.error(`[GET_RESOURCE_URLS | ${resource}] Promise for feed ${nugetFeeds[i]} was rejected, for reason ${x.reason}`);
        return undefined
      }

      const res = x.value;
      if (res.status !== 200) {
        logger.error(`[GET_RESOURCE_URLS | ${resource}] Failed to get response from ${nugetFeeds[i]}: ${res.status} `);
        return undefined
      }

      logger.info(`[GET_RESOURCE_URLS | ${resource}] Recieved resource from ${nugetFeeds[i]}`)
      const respResources = res.data.resources as Array<{ '@type': string, '@id': string }>
      const registrationResource = respResources.find(r => r['@type'] === resource);
      return registrationResource?.["@id"]

    }).filter(x => x !== undefined);

  return urls;
};

async function getFirstSuccessful(urls: Array<string>)
  : Promise<AxiosResponse<any, any> | undefined> {

  for (let u of urls) {
    const res = await axios.get(u, { validateStatus: () => true });
    if (res.status === 200) {
      return res;
    }
  }

  return undefined;
}

interface NugetRegistrationResponse {
  items: Array<NugetCatalogPage>
}

interface NugetCatalogPage {
  items: Array<NugetcatalogItem>
}

interface NugetcatalogItem {
  '@type': string
  catalogEntry: NugetCatalogEntry
}

interface NugetCatalogEntry {
  vulnerabilities: Array<Vulnerability>;
  authors: string
  description: string
  summary: string
  tags: Array<string>
  id: string
  version: string
  dependencyGroups: Array<DependencyGroup>
}

interface DependencyGroup {
  targetFramework: string
  dependencies: Array<Dependency>
}

interface Dependency {
  "@type": string,
  id: "System.Collections",
  range: string,
}

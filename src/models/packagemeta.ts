export interface PackageMetaData {
  packageName: string
  versions: Array<PackageVersion>
}

export interface PackageVersion {
  version: string
  description: string
  tags: string[]
  authors: string
  vulnerabilities: Array<Vulnerability>
  dependencies: Array<PackageDependancy>
}

export interface PackageDependancy {
  packageName: string,
  versionRange: string,
}

export interface Vulnerability {
  severity: string
  advisoryUrl: string
}

export const SeverityLanguage: Record<string, string> = {
  "0": "Advisory",
  "1": "Low",
  "2": "Moderate",
  "3": "High",
  "4": "Critical",
}

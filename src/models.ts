import { Range } from "vscode-languageserver"

export interface CSProjectFileSpec {
  uri: string;
  targetFramework?: Token
  packageReferences: Array<PackageReference>
  projectReferences: Array<ProjectReference>
}

export interface Token {
  value: string
  range: Range
}

export interface PackageReference {
  packageName: Token
  packageVersion: Token
  range: Range
}

export interface ProjectReference {
  path: Token
  range: Range
}

export interface NugetPackageMetaData {
  packageName: string
  versions: Array<NugetPackageVersion>
}

export interface NugetPackageVersion {
  version: string
  description: string
  tags: string[]
  authors: string
  vulnerabilities: Array<Vulnerability>
  dependencies: Array<NugetDependencyPackage>
}

export interface NugetDependencyPackage {
  packageName: string,
  versionRange: string,
}

export interface Vulnerability {
  serverity: string
  advisoryUrl: string
}

export const SeverityLanguage: Record<string, string> = {
  "0": "Advisory",
  "1": "Low",
  "2": "Moderate",
  "3": "High",
  "4": "Critical",
}

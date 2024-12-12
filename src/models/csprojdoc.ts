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
  packageNameToken: Token
  packageVersionToken: Token
  range: Range
}

export interface ProjectReference {
  pathToken: Token
}

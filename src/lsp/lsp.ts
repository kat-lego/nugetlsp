import {
  //CompletionItem,
  //CompletionItemKind,
  Hover,
  Position,
  Range,
  //Definition,
} from "vscode-languageserver/node";
import winston from 'winston'
//import path from "path";
import { CSProjectFileSpec } from "../models/csprojdoc";
import { PackageMetaData, PackageVersion, SeverityLanguage } from "../models/packagemeta";

export function provideHover(
  doc: CSProjectFileSpec,
  pos: Position,
  pkgM: Record<string, PackageMetaData>,
  logger: winston.Logger
): Hover | undefined {

  const providers = [packageReferenceHoverProvider];

  for (let p of providers) {
    const hover = p(doc, pos, pkgM, logger);
    if (hover) return hover;
  }

  return undefined;
}

function packageReferenceHoverProvider(
  doc: CSProjectFileSpec,
  pos: Position,
  pkgM: Record<string, PackageMetaData>,
  logger: winston.Logger
): Hover | undefined {

  const pkg = doc.packageReferences.find(x => isInRange(x.range, pos));
  const metaDataVersions = pkgM[pkg?.packageNameToken.value ?? ""]?.versions ?? []
  const pkgv = metaDataVersions.find(v => v.version === pkg?.packageVersionToken.value);

  logger.info(`[PACKAGE_REFERENCE_HOVER_PROVIDER | ${doc.uri}: ${pos.line}, ${pos.character}] At package ${pkg?.packageNameToken.value ?? "<undefined>"} at `)

  if (!pkg || !pkgv) return undefined;

  return {
    contents: {
      kind: 'markdown',
      value: getPackageHoverMessage(pkg.packageNameToken.value, pkgv)
    }
  };
}


//export async function provideCodeCompletion(
//  doc: CSProjectFileSpec,
//  pos: Position,
//  logger: winston.Logger
//): Promise<CompletionItem[]> {
//
//  logger.info(`providing code completion at line ${pos.line}, char ${pos.character}`);
//
//  const items: CompletionItem[] = []
//
//  const pkg = doc.packageReferences.find(x => isInRange(x.range, pos));
//  if (pkg) {
//    const nugetSearch = await nuget.autoCompleteSearch(pkg.packageName.value, logger);
//
//    nugetSearch.forEach(n => {
//      items.push({
//        label: n,
//        detail: 'search package',
//        documentation: 'nuget package name',
//        kind: CompletionItemKind.Text,
//      })
//    })
//  }
//
//  return items;
//}

//export function provideGoToDefinition(
//  doc: CSProjectFileSpec,
//  pos: Position,
//  logger: winston.Logger): Definition | undefined {
//
//  logger.info(`providing go to definition at line ${pos.line}, char ${pos.character}`);
//
//  const prj = doc.projectReferences.find(x => isInRange(x.range, pos));
//  if (prj && prj.path) {
//    let gotoUri = prj.path.value.replace(/\\/g, '');
//
//    if (!path.isAbsolute(gotoUri)) {
//      const currDir = doc.uri.replace('file://', '');
//      gotoUri = path.normalize(path.resolve(currDir, gotoUri));
//    }
//
//    return {
//      uri: `file://${gotoUri}`,
//      range: Range.create(0, 0, 0, 0),
//    }
//  }
//
//  return undefined;
//}

function isInRange(range: Range, pos: Position): boolean {
  return range.start.line <= pos.line && pos.line <= range.end.line
    && range.start.character <= pos.character && pos.character <= range.end.character;
}

function getPackageHoverMessage(packageId: string, meta: PackageVersion): string {

  let message = `
### ${packageId}
  **Description**: ${meta.description}
  **Version**: ${meta.version}
  **Authors**: ${meta.authors}
  **Tags**: ${meta.tags.join(' | ')}`

  if (meta.vulnerabilities && meta.vulnerabilities.length > 0) {
    message += '\n\n  **Vulnerabilities**:\n'
    meta.vulnerabilities.forEach(v => {
      message += `    - **Severity**: ${SeverityLanguage[v.severity]}\n`
      message += `    - **Advisory Url**: ${v.advisoryUrl}`
    })
  }

  return message;
}


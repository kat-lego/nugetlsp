import {
  CodeAction,
  CodeActionKind,
  CompletionItem,
  CompletionItemKind,
  Definition,
  Diagnostic,
  DiagnosticSeverity,
  Hover,
  InsertTextFormat,
  Position,
  PublishDiagnosticsParams,
  Range,
  TextEdit,
} from "vscode-languageserver/node";
import winston from 'winston'
import { CSProjectFileSpec } from "../models/csprojdoc";
import * as nuget from "../nuget/nuget";
import { PackageMetaData, PackageVersion, SeverityLanguage } from "../models/packagemeta";
import path from "path";
import { version } from "os";

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

  logger.info(`[PACKAGE_REFERENCE_HOVER_PROVIDER | doc: ${doc.uri}, line: ${pos.line},`
    + `char: ${pos.character}] At package ${pkg?.packageNameToken.value ?? "<undefined>"} at `)

  if (!pkg || !pkgv) return undefined;

  return {
    contents: {
      kind: 'markdown',
      value: getPackageHoverMessage(pkg.packageNameToken.value, pkgv)
    }
  };
}

export async function provideCodeCompletion(
  doc: CSProjectFileSpec,
  pos: Position,
  logger: winston.Logger
): Promise<CompletionItem[]> {

  logger.info(`[PROVIDE_CODE_COMPLETION | doc: ${doc.uri}, line: ${pos.line}, char: ${pos.character}]`);

  const items: CompletionItem[] = []

  const pkg = doc.packageReferences.find(x => isInRange(x.range, pos));
  if (pkg) {
    const nugetSearch = await nuget.autoCompleteSearch(pkg.packageNameToken.value, logger);

    logger.info(`[PROVIDE_CODE_COMPLETION | doc: ${doc.uri}, line: ${pos.line}, char: ${pos.character}]`);

    nugetSearch.forEach(n => {
      items.push({
        label: n,
        insertText: n,
        detail: 'search package',
        documentation: 'nuget package name',
        kind: CompletionItemKind.Text,
      })
    })
  }

  items.push({
    label: 'PackageReference',
    detail: 'Package reference',
    documentation: 'Add a package reference',
    kind: CompletionItemKind.Text,
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: '<PackageReference Include="${1:package}" Version="" />'
  })

  items.push({
    label: 'ProjectReference',
    detail: 'Project Reference',
    documentation: 'Add a project reference',
    kind: CompletionItemKind.Text,
    insertTextFormat: InsertTextFormat.Snippet,
    insertText: '<ProjectReference Include="${1:project}" />'
  })

  return items;
}

export function provideGoToDefinition(
  doc: CSProjectFileSpec,
  pos: Position,
  logger: winston.Logger): Definition | undefined {

  logger.info(`providing go to definition at line ${pos.line}, char ${pos.character}`);

  const prj = doc.projectReferences.find(x => isInRange(x.pathToken.range, pos));
  if (prj) {
    let gotoUri = prj.pathToken.value.replace(/\\/g, '');

    if (!path.isAbsolute(gotoUri)) {
      const currDir = path.dirname(doc.uri.replace('file://', ''));
      gotoUri = path.normalize(path.resolve(currDir, gotoUri));
    }

    return {
      uri: `file://${gotoUri}`,
      range: Range.create(0, 0, 0, 0),
    }
  }

  return undefined;
}

export function provideCodeActions(
  doc: CSProjectFileSpec,
  pos: Position,
  pkgM: Record<string, PackageMetaData>,
  logger: winston.Logger
): CodeAction[] {


  const codeActions: CodeAction[] = [];

  const pkg = doc.packageReferences.find(x => isInRange(x.range, pos));

  if (!pkg) {
    logger.warn(`PROVIDE_CODE_ACTIONS: Not In a package`);
    return [];
  }

  const allVersions = pkgM[pkg?.packageNameToken.value ?? ""]?.versions ?? []

  const versions = allVersions.filter(v => {
    return v.vulnerabilities.length === 0
  })

  logger.warn(`PROVIDE_CODE_ACTIONS: Providing actions for ${pkg.packageNameToken.value}`);

  versions.slice(0, 15).forEach(v => {

    const edit: TextEdit = {
      range: pkg.packageVersionToken.range,
      newText: `"${v.version}"`,
    };

    codeActions.push({
      title: `use version ${v.version}`,
      kind: CodeActionKind.QuickFix,
      edit: {
        changes: {
          [doc.uri]: [edit]
        }
      }
    })

  });

  return codeActions
}

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

export function provideDiagnostics(
  doc: CSProjectFileSpec,
  N: Record<string, PackageMetaData>,
  logger: winston.Logger): PublishDiagnosticsParams {

  logger.info(`[PROVIDE_DIAGNOSTICS | ${doc.uri}]`);

  const vulnerabilities = doc.packageReferences.filter(p => {
    const packageVersions = N[p.packageNameToken.value].versions;
    if (!packageVersions) return false;

    const usedPackageVersion = packageVersions.find(v =>
      v.version === p.packageVersionToken.value)

    if (!usedPackageVersion) return false;

    return usedPackageVersion.vulnerabilities.length !== 0;
  })

  const diagnostics = vulnerabilities.map((p): Diagnostic => {
    return {
      range: p.packageVersionToken.range,
      severity: DiagnosticSeverity.Error,
      message: `Version ${p.packageVersionToken.value} has vulnerabilities`,
      source: 'nugetlsp'
    }
  })

  return {
    uri: doc.uri,
    diagnostics: diagnostics
  }
}


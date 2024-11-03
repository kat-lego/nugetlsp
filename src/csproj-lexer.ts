import { CSProjectFileSpec, PackageReference, ProjectReference, Token } from "./models";
import Parser, { SyntaxNode } from "tree-sitter";
import CsProjLang from "tree-sitter-csproj"
import { Range } from "vscode-languageserver";
import winston from "winston";

const parser = new Parser();

parser.setLanguage(CsProjLang);

export function initializeCsProj(
  doc: string,
  docUri: string,
  logger: winston.Logger
): CSProjectFileSpec {

  const tree = parser.parse(doc);
  const csp: CSProjectFileSpec = {
    uri: docUri,
    targetFramework: getTargetFrameworkNode(tree.rootNode, logger),
    packageReferences: getPackageReferences(tree.rootNode, logger),
    projectReferences: getProjectReferences(tree.rootNode, logger),
  };

  return csp;
}

function getTargetFrameworkNode(treeNode: SyntaxNode, logger: winston.Logger): Token | undefined {

  const queryText = '(target_framework (text) @tf)';

  const query = new Parser.Query(CsProjLang, queryText);
  const captures = query.captures(treeNode);

  const tf = captures.find(x => x.name === 'tf')?.node;
  if (!tf) {
    logger.warn("Target framework not found");
    return undefined;
  }

  return { value: tf.text, range: getRange(tf) }
}

function getPackageReferences(treeNode: SyntaxNode, logger: winston.Logger)
  : Array<PackageReference> {

  const queryText = `
  (package_reference_openclose
    (package_reference_tag_name)
    (package_reference_include_attribute (attribute_value) @prn)
    (package_reference_version_attribute (attribute_value) @prv)) @pr`;

  const query = new Parser.Query(CsProjLang, queryText);
  const matches = query.matches(treeNode);

  const packages = matches.map(m => {
    const pkg = {
    } as PackageReference;

    m.captures.forEach(c => {

      if (c.name === 'pr') {
        pkg.range = getRange(c.node);
      }

      if (c.name === 'prv') {
        pkg.packageVersion = {
          value: c.node.text.replace(/["]+/g, ''),
          range: getRange(c.node)
        };
      }

      if (c.name === 'prn') {
        pkg.packageName = {
          value: c.node.text.replace(/["]+/g, ''),
          range: getRange(c.node)
        }
      }
    })
    return pkg;
  })

  if (!packages || packages.length == 0) {
    logger.warn("No packages matched")
  }

  return packages;
}

function getProjectReferences(treeNode: SyntaxNode, logger: winston.Logger)
  : Array<ProjectReference> {

  const queryText = `
  (project_reference_openclose
    (project_reference_tag_name)
    (project_reference_include_attribute (attribute_value) @prn))`;

  const query = new Parser.Query(CsProjLang, queryText);
  const captures = query.captures(treeNode);

  const projects = captures.map(c => {
    return {
      path: {
        value: c.node.text.replace(/["]+/g, ''),
        range: getRange(c.node)
      }
    } as ProjectReference;
  })

  if (!projects || projects.length == 0) {
    logger.warn("No projects matched")
  }

  return projects;
}

function getRange(n: SyntaxNode): Range {
  return {
    start: { line: n.startPosition.row, character: n.startPosition.column },
    end: { line: n.endPosition.row, character: n.endPosition.column }
  } as Range
}


#!/usr/bin/env node

import winston from "winston";
import os from 'os';
import path from 'path';
import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import * as lex from "./lexer/lexer";
import * as lsp from "./lsp/lsp";
import * as nuget from "./nuget/nuget";
import { CSProjectFileSpec } from "./models/csprojdoc";
import { PackageMetaData } from "./models/packagemeta";

const appName = 'nugetlsp';
const tmpdir = path.join(os.tmpdir(), appName);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) => `[${info.timestamp}][${info.level}]${info.message}`)
  ),
  transports: [
    new winston.transports.File({ filename: path.join(tmpdir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(tmpdir, 'combined.log') }),
  ],
});

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const D: Record<string, CSProjectFileSpec> = {};
const N: Record<string, PackageMetaData> = {};

connection.onInitialize(() => {

  logger.info("Initializing nuget language server protocol");

  return {
    serverInfo: {
      name: `nugetlsp@${os.hostname()}`,
      version: `0.0.1-beta`
    },
    capabilities: {
      textDocumentSync: {
        openClose: true,
        change: TextDocumentSyncKind.Incremental,
      },
      codeActionProvider: true,
      hoverProvider: true,
      completionProvider: {},
      declarationProvider: true,
      definitionProvider: true,
    }
  };
});

connection.onInitialized(() => {
  logger.info("Initialized nuget language server protocol");
});

documents.onDidOpen((event) => {
  logger.info(`Document Opened | %docUri`, event.document.uri);
  const doc = lex.initializeCsProj(event.document.getText(), event.document.uri, logger);
  D[event.document.uri] = doc;

  doc.packageReferences.forEach(x => {
    const p = x.packageNameToken.value;

    if (N[p] || !doc.targetFramework) return;

    nuget.getPackageMetadata(p, doc.targetFramework.value, logger)
      .then(x => { if (x) N[p] = x });
  });

  setTimeout(() => {
    const diagnostics = lsp.provideDiagnostics(D[event.document.uri], N, logger);
    connection.sendDiagnostics(diagnostics)
  }, 2000)
});

documents.onDidChangeContent((event) => {
  logger.info(`Document Changed | %docUri`, event.document.uri);
  const doc = lex.initializeCsProj(event.document.getText(), event.document.uri, logger);
  D[event.document.uri] = doc;

  doc.packageReferences.forEach(x => {
    const p = x.packageNameToken.value;

    if (N[p] || !doc.targetFramework) return;

    nuget.getPackageMetadata(p, doc.targetFramework.value, logger)
      .then(x => { if (x) N[p] = x });
  });

  setTimeout(() => {
    const diagnostics = lsp.provideDiagnostics(D[event.document.uri], N, logger);
    connection.sendDiagnostics(diagnostics)
  }, 2000)

});

documents.onDidClose((event) => {
  logger.info(`Document Closed | %docUri`, event.document.uri);
  delete D[event.document.uri];
});

connection.onHover((event) => {
  logger.info(`Hover Requested | %docUri`, event.textDocument.uri);
  return lsp.provideHover(D[event.textDocument.uri], event.position, N, logger);
});

connection.onCodeAction((event) => {
  logger.info(`Code Action Requested | %docUri`, event.textDocument.uri)
  return lsp.provideCodeActions(D[event.textDocument.uri], event.range.start, N, logger);
});

connection.onCompletion(async (event) => {
  logger.info(`Completion Requested | %docUri`, event.textDocument.uri);
  return await lsp.provideCodeCompletion(D[event.textDocument.uri], event.position, logger);
});

connection.onDefinition((event) => {
  logger.info(`Go to Definition Requested | %docUri`, event.textDocument.uri);
  return lsp.provideGoToDefinition(D[event.textDocument.uri], event.position, logger);
});

documents.listen(connection);
connection.listen();

import * as winston from "winston";
import * as os from 'os';
import * as path from 'path';
import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { statestore } from "./models";

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
    }
  };
});

connection.onInitialized(() => {
  logger.info("Initializing nuget language server protocol");
});

documents.onDidOpen((event) => {
  logger.info(`Document Opened | ${event.document.uri}`);
})

documents.onDidChangeContent((event) => {
  logger.info(`Document Opened | ${event.document.uri}`);
})

connection.onHover((params) => {
  logger.info(`Hover Requested | ${params.textDocument.uri}`);
  return null
})

connection.onCodeAction((params) => {
  logger.info(`Code Action Requested | ${params.textDocument.uri}`)
  return null
})

connection.onCompletion((params) => {
  logger.info(`Completion Requested | ${params.textDocument.uri}`);
  return null;
});

connection.onDefinition((params) => {
  logger.info(`Go to Definition Requested | ${params.textDocument.uri}`);
  return null;
});

documents.listen(connection);
connection.listen();

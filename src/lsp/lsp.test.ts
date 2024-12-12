//import * as winston from "winston"
//
//const logger = winston.createLogger({
//  level: 'info',
//  format: winston.format.simple(),
//  transports: [
//    new winston.transports.Console({}),
//  ]
//});
//
//describe("lsp provider tests", () => {
//
//  it("should provide hover", () => {
//
//    const doc = {
//      uri: "testdoc",
//      targetFramework: {
//        value: "net8.0",
//        range: {
//          start: { line: 5, character: 27 },
//          end: { line: 5, character: 33 },
//        }
//      },
//      packageReferences: [
//        {
//          packageName: {
//            value: "Newtonsoft.Json",
//            range: {
//              start: { line: 12, character: 36 },
//              end: { line: 12, character: 53 },
//            }
//          },
//          packageVersion: {
//            value: "13.0.3",
//            range: {
//              start: { line: 12, character: 62 },
//              end: { line: 12, character: 70 },
//
//            }
//          },
//          range: {
//            start: { line: 12, character: 0 },
//            end: { line: 12, character: 77 },
//          }
//        },
//      ],
//      projectReferences: []
//    };
//    const pos = { line: 12, character: 44 };
//    const pkgM: Record<string, NugetPackageMetaData> = {
//      'Newtonsoft.Json': {
//        packageName: 'Newtonsoft.Json',
//        versions: [
//          {
//            authors: 'James Newton-King',
//            version: '13.0.3',
//            description: 'Json.NET is a popular high-performance JSON framework for .NET',
//            tags: ["Tag1"],
//            dependencies: [],
//            vulnerabilities: []
//          },
//          {
//            authors: 'James Newton-King',
//            version: '13.0.3-beta1',
//            description: 'Json.NET is a popular high-performance JSON framework for .NET',
//            tags: ["Tag3"],
//            dependencies: [],
//            vulnerabilities: [],
//          }
//        ]
//      }
//    };
//    const hover = provideHover(doc, pos, pkgM, logger);
//
//    expect(hover).toBeTruthy();
//    expect(hover?.range).toEqual({});
//  })
//
//  it("should provide completion", () => {
//
//  })
//});

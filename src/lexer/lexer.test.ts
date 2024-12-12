import * as winston from "winston"
import * as lexer from "./lexer"

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({}),
  ]
});

describe("csproj lexer tests", () => {

  it("should parse an empty csproj file", () => {
    const docSpec = lexer.initializeCsProj("", "testdoc", logger);
    expect(docSpec).toEqual({
      uri: "testdoc",
      targetFramework: undefined,
      packageReferences: [],
      projectReferences: [],
    })
  })

  it("should parse target framework", () => {
    const doc =
      `<Project Sdk="Microsoft.NET.Sdk">
        <PropertyGroup>
          <TargetFramework>net8.0</TargetFramework>
        </PropertyGroup>

      </Project>`

    const docSpec = lexer.initializeCsProj(doc, "testdoc", logger);
    expect(docSpec).toEqual({
      uri: "testdoc",
      targetFramework: {
        value: "net8.0",
        range: {
          start: { line: 2, character: 27 },
          end: { line: 2, character: 33 },
        }
      },
      packageReferences: [],
      projectReferences: [],
    })
  })

  it("should parse target framework, even when other parts are invalid", () => {
    const doc =
      `<Project Sdk="Microsoft.NET.Sdk">
        <PropertyGroup>
        <PropertyGroup>
          <TargetFramework>net8.0</TargetFramework>
        </PropertyGroup>

        <ItemGroup>
        <ItemGroup
      </Project>`

    const docSpec = lexer.initializeCsProj(doc, "testdoc", logger);
    expect(docSpec).toEqual({
      uri: "testdoc",
      targetFramework: {
        value: "net8.0",
        range: {
          start: { line: 3, character: 27 },
          end: { line: 3, character: 33 },
        }
      },
      packageReferences: [],
      projectReferences: [],
    })
  })

  it("should parse package references", () => {

    const doc =
      `<Project Sdk="Microsoft.NET.Sdk">
        <ItemGroup>
          <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
          <PackageReference Include="Polly" Version="8.4.1" />
        </ItemGroup>
      </Project>`

    const docSpec = lexer.initializeCsProj(doc, "testdoc", logger);
    expect(docSpec).toEqual({
      uri: "testdoc",
      targetFramework: undefined,
      packageReferences: [
        {
          packageNameToken: {
            value: "Newtonsoft.Json",
            range: {
              start: { line: 2, character: 36 },
              end: { line: 2, character: 53 },
            }
          },
          packageVersionToken: {
            value: "13.0.3",
            range: {
              start: { line: 2, character: 62 },
              end: { line: 2, character: 70 },
            }
          },
          range: {
            start: { line: 2, character: 10 },
            end: { line: 2, character: 73 },
          }
        },
        {
          packageNameToken: {
            value: "Polly",
            range: {
              start: { line: 3, character: 36 },
              end: { line: 3, character: 43 },
            }
          },
          packageVersionToken: {
            value: "8.4.1",
            range: {
              start: { line: 3, character: 52 },
              end: { line: 3, character: 59 },
            }
          },
          range: {
            start: { line: 3, character: 10 },
            end: { line: 3, character: 62 },
          }
        }
      ],
      projectReferences: [],
    })
  })

  it("should parse project references", () => {
    const doc = `
      <Project Sdk="Microsoft.NET.Sdk">
        <ItemGroup>
          <ProjectReference Include="some csproj file2" />
          <ProjectReference Include="some csproj file" />
        </ItemGroup>
      </Project>
    `;

    const docSpec = lexer.initializeCsProj(doc, "testdoc", logger);

    expect(docSpec).toEqual({
      uri: "testdoc",
      targetFramework: undefined,
      packageReferences: [],
      projectReferences: [
        {
          pathToken: {
            value: "some csproj file2",
            range: {
              start: { line: 3, character: 36 },
              end: { line: 3, character: 55 },
            }
          }
        },
        {
          pathToken: {
            value: "some csproj file",
            range: {
              start: { line: 4, character: 36 },
              end: { line: 4, character: 54 },
            }
          }
        }
      ]
    })
  })
});

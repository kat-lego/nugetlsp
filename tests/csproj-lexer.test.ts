import * as winston from "winston"
import { initializeCsProj } from "../src/csproj-lexer"
import { CSProjectFileSpec } from "../src/models";

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({}),
  ]
});

describe("csproj lexer tests", () => {

  it("should parse a csproj file", () => {
    const doc = `
      <Project Sdk="Microsoft.NET.Sdk">

        <PropertyGroup>
          <OutputType>Exe</OutputType>
          <TargetFramework>net8.0</TargetFramework>
          <RootNamespace>dotnet_console</RootNamespace>
          <ImplicitUsings>enable</ImplicitUsings>
          <Nullable>enable</Nullable>
        </PropertyGroup>

        <ItemGroup>
          <PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
          <PackageReference Include="Polly" Version="8.4.1" />
        </ItemGroup>

        <ItemGroup>
          <ProjectReference Include="some csproj file2" />
          <ProjectReference Include="some csproj file" />
        </ItemGroup>

      </Project>
    `;

    const docSpec = initializeCsProj(doc, "testdoc", logger);

    expect(docSpec).toEqual({
      uri: "testdoc",
      targetFramework: {
        value: "net8.0",
        range: {
          start: { line: 5, character: 27 },
          end: { line: 5, character: 33 },
        }
      },
      packageReferences: [
        {
          packageName: {
            value: "Newtonsoft.Json",
            range: {
              start: { line: 12, character: 36 },
              end: { line: 12, character: 53 },
            }
          },
          packageVersion: {
            value: "13.0.3",
            range: {
              start: { line: 12, character: 62 },
              end: { line: 12, character: 70 },
            }
          },
          range: {
            start: { line: 12, character: 10 },
            end: { line: 12, character: 73 },
          }
        },
        {
          packageName: {
            value: "Polly",
            range: {
              start: { line: 13, character: 36 },
              end: { line: 13, character: 43 },
            }
          },
          packageVersion: {
            value: "8.4.1",
            range: {
              start: { line: 13, character: 52 },
              end: { line: 13, character: 59 },
            }
          },
          range: {
            start: { line: 13, character: 10 },
            end: { line: 13, character: 62 },
          }
        }
      ],
      projectReferences: [
        {
          path: {
            value: "some csproj file2",
            range: {
              start: { line: 17, character: 36 },
              end: { line: 17, character: 55 },
            }
          }
        },
        {
          path: {
            value: "some csproj file",
            range: {
              start: { line: 18, character: 36 },
              end: { line: 18, character: 54 },
            }
          }
        }
      ]
    } as CSProjectFileSpec)
  })
});

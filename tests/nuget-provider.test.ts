import * as winston from "winston"
import * as nuget from "../src/nuget-provider"
import { NugetDependencyPackage, NugetPackageVersion } from "../src/models";

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console({}),
  ]
});

describe("nuget provider tests", () => {

  it("should get nuget package metadata for newtonsoft", async () => {
    const packageName = "Newtonsoft.Json";
    const targetFramework = "net8.0";

    const res = await nuget.getPackageMetadata(packageName, targetFramework, logger);

    expect(res).toBeDefined();

    if (res !== undefined) {
      expect(res.packageName).toBe("Newtonsoft.Json");

      expect(res.versions[0]).toEqual({
        authors: "James Newton-King",
        version: "13.0.3",
        tags: ["json"],
        description: "Json.NET is a popular high-performance JSON framework for .NET",
        dependencies: [] as Array<NugetDependencyPackage>
      } as NugetPackageVersion);

      expect(res.versions[80]).toEqual({
        authors: "James Newton-King",
        version: "3.5.8",
        tags: [""],
        description: "Json.NET is a popular high-performance JSON framework for .NET",
        dependencies: [] as Array<NugetDependencyPackage>
      } as NugetPackageVersion);

      expect(res.versions.length).toBe(81);
    }

  })

  it(`should autocomplete for newtonsoft`, async () => {
    let res = await nuget.autoCompleteSearch("new", logger);
    expect(res).toContain("Newtonsoft.Json")

    res = await nuget.autoCompleteSearch("newton", logger);
    expect(res).toContain("Newtonsoft.Json")
  })

});

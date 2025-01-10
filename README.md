# nugetlsp

An implementation of a language server following the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/). This LSP provides the following.

- [x] **Package On Hover**: Displays nuget package information such as the description, authors, tags,
vulnerabilities.

- [x] **Package Code Action**: Code Action to change package version

- [x] **Package Autocompletion**: Auto completion for package names

- [x] **Project Reference Go to definition**: Open a referenced csproj file

- [x] **Package Diagnostic**: Diagnostic on a vulnerable package

- [ ] **Transitive Package Diagnostic**: Showing the transitive dependency path leading to a 
package vulnerability

Other things Todo:
- [ ] **cli parsing**: add version help, and version tags to the cli
- [ ] **github workflows**: add github workflow to publish to npm on tags
- [ ] **testing**: unit tests on the modules

## Installing Locally for testing

- remove installed version: `npm remove -g nugetlsp`
- `npm run build` to build the project
- `npm link` to install the local version
- remove it with: `npm remove -g nugetlsp`

# doxdox-fetch

> Fetch utilities for doxdox server.

[![NPM version](https://img.shields.io/npm/v/doxdox-fetch?style=flat-square)](https://www.npmjs.org/package/doxdox-fetch)
[![NPM downloads per month](https://img.shields.io/npm/dm/doxdox-fetch?style=flat-square)](https://www.npmjs.org/package/doxdox-fetch)
[![doxdox documentation](https://img.shields.io/badge/doxdox-documentation-%23E85E95?style=flat-square)](https://doxdox.org)

## Install

```bash
$ npm install doxdox-fetch --save
```

## Usage

<https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token>

**.env**

```yaml
GITHUB_API_TOKEN_READONLY=xxxxx
```

**package.json**

```json
{
  "type": "module",
  "dependencies": {
    "doxdox-fetch": "2.0.0"
  },
  "devDependencies": {
    "dotenv": "16.0.0"
  },
  "scripts": {
    "test": "node -r dotenv/config index.js"
  },
  "private": true
}
```

**index.js**

```javascript
import { downloadFile, getRepoData, parseFiles } from 'doxdox-fetch';

import { parseString } from 'doxdox-parser-custom';

import { Doc } from 'doxdox-core/dist/types';

(async () => {
  const repoData = await getRepoData(username, repo, {
    GITHUB_API_TOKEN: process.env.GITHUB_API_TOKEN_READONLY
  });

  const currentBranch =
    branch && [repoData.default_branch, ...repoData.tags].includes(branch)
      ? branch
      : repoData.default_branch;

  const files = await downloadFile(username, repo, currentBranch, [
    /.[jt]sx?$/,
    /package.json$/,
    /\.doxdoxignore$/
  ]);

  const jsFiles = files.filter(
    ({ path }) =>
      path.match(/\.[jt]sx?$/) &&
      !path.match(/\.min\.[jt]sx?$/) &&
      !path.match(/\.test\.[jt]sx?$/) &&
      !path.match(/^dist\//) &&
      !path.match(/__tests__\//)
  );

  const pkgFile = files.find(({ path }) => path.match(/package\.json$/));

  const pkgFileContents = JSON.parse(pkgFile?.content || '{}');

  const doc: Doc = {
    name: pkgFileContents.name || repoData.name,
    description: pkgFileContents.description || repoData.description,
    homepage: pkgFileContents.homepage || repoData.html_url,
    files: await parseFiles(jsFiles, parseString)
  };

  console.log(doc);
})();
```

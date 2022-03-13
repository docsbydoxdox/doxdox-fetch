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
    "doxdox-fetch": "1.0.0"
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

(async () => {
  const data = await getRepoData('neogeek', 'pocket-sized-facade.js', {
    GITHUB_API_TOKEN: process.env.GITHUB_API_TOKEN_READONLY
  });

  const files = await downloadFile(
    'neogeek',
    'pocket-sized-facade.js',
    data.default_branch,
    [/.js$/, /package.json$/, /\.doxdoxignore$/]
  );

  const jsFiles = files.filter(
    ({ path }) =>
      path.match(/\.js$/) &&
      !path.match(/\.min\.js$/) &&
      !path.match(/\.test\.js$/) &&
      !path.match(/^dist\//) &&
      !path.match(/__tests__\//)
  );

  const pkgFile = files.find(({ path }) => path.match(/package\.json$/));

  const pkgFileContents = JSON.parse(pkgFile?.content || '{}');

  const doc = {
    name: pkgFileContents.name || data.name,
    description: pkgFileContents.description || data.description,
    homepage: pkgFileContents.homepage || data.html_url,
    files: await parseFiles(jsFiles)
  };

  console.log(doc);
})();
```

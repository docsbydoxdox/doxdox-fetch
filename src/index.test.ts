import { downloadFile, getRepoData } from './index';

if (!process.env.API_TOKEN_READONLY) {
  throw new Error(`Missing API_TOKEN_READONLY env variable!`);
}

describe('doxdox fetch utilities', () => {
  it('downloadFile', async () => {
    await expect(
      downloadFile('neogeek', 'raspar', 'main', [/.js$/, /package.json$/])
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'lib/raspar.js'
        })
      ])
    );
  });
  it('getRepoData', async () => {
    await expect(
      getRepoData('neogeek', 'raspar', {
        GITHUB_API_TOKEN: process.env.API_TOKEN_READONLY
      })
    ).resolves.toEqual(
      expect.objectContaining({
        name: 'raspar',
        private: false,
        html_url: 'https://github.com/neogeek/raspar',
        description: expect.anything(),
        default_branch: 'main',
        language: 'JavaScript',
        tags: expect.arrayContaining(['v3.0.1', 'v3.0.0'])
      })
    );
  });
});

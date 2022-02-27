import axios from 'axios';

import Zip from 'adm-zip';

import { File } from 'doxdox-core';

import { parseString } from 'doxdox-parser-jsdoc';

import { Repo, RepoData, RawTag } from './types';

export const downloadFile = async (
    username: string,
    repo: string,
    branch: string,
    filterPatterns: RegExp[] = []
): Promise<{ path: string; content: string }[]> => {
    const { data } = await axios({
        url: `https://github.com/${username}/${repo}/archive/${branch}.zip`,
        method: 'GET',
        responseType: 'arraybuffer'
    });

    return await unzipFile(Buffer.from(data), filterPatterns);
};

export const getRepoData = async (
    username: string,
    repo: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    branch?: string | undefined
): Promise<Repo> => {
    const { data: repoData } = await axios.get<RepoData>(
        `https://api.github.com/repos/${username}/${repo}`,
        {
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_API_TOKEN_READONLY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    const { data: rawTags } = await axios.get<RawTag[]>(
        `https://api.github.com/repos/${username}/${repo}/tags`,
        {
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_API_TOKEN_READONLY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    const tags = rawTags.map((rawTag: RawTag) => rawTag.name);

    return {
        name: repoData.name,
        private: repoData.private,
        html_url: repoData.html_url,
        description: repoData.description,
        default_branch: repoData.default_branch,
        language: repoData.language,
        tags
    };
};

export const parseFiles = async (
    files: { path: string; content: string }[]
): Promise<File[]> =>
    await Promise.all(
        files.map(async ({ path, content }) => await parseString(path, content))
    );

export const unzipFile = async (
    buffer: Buffer,
    filterPatterns: RegExp[] = []
): Promise<{ path: string; content: string }[]> => {
    const entries = new Zip(buffer).getEntries();

    const [rootDir] = entries
        .filter(entry => entry.isDirectory)
        .map(entry => entry.entryName);

    const files = entries.filter(
        (entry: { isDirectory: boolean }) => !entry.isDirectory
    );

    return Promise.all(
        files
            .filter(entry =>
                filterPatterns.some(pattern => entry.entryName.match(pattern))
            )
            .map(async entry => ({
                path: entry.entryName.replace(new RegExp(`^${rootDir}`), ''),
                content: entry.getData().toString()
            }))
    );
};

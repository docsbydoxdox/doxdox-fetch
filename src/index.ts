import axios from 'axios';

import Zip from 'adm-zip';

import { File } from 'doxdox-core';

import { parseString } from 'doxdox-parser-jsdoc';

import { fetch } from 'raspar';

import { Repo, Tag } from './types';

const BYTES_IN_MB = 1000000;

const DEFAULT_MAX_BUFFER_SIZE_MB = 10;

export const downloadFile = async (
    username: string,
    repo: string,
    branch: string,
    filterPatterns: RegExp[] = []
): Promise<{ path: string; content: string }[]> => {
    const { data } = await axios.get(
        `https://github.com/${username}/${repo}/archive/${branch}.zip`,
        {
            responseType: 'arraybuffer'
        }
    );

    return await unzipFile(Buffer.from(data), filterPatterns);
};

export const getRepoDataRaw = async (
    username: string,
    repo: string,
    options: { GITHUB_API_TOKEN?: string } = {}
): Promise<{ repoData: Repo; rawTags: Tag[] }> => {
    const repoData = await fetch(
        `https://api.github.com/repos/${username}/${repo}`,
        {
            requestOptions: {
                headers: {
                    Authorization: `Bearer ${options.GITHUB_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        }
    );

    const rawTags = await fetch(
        `https://api.github.com/repos/${username}/${repo}/tags`,
        {
            requestOptions: {
                headers: {
                    Authorization: `Bearer ${options.GITHUB_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        }
    );

    return {
        repoData: JSON.parse(repoData) as Repo,
        rawTags: JSON.parse(rawTags) as Tag[]
    };
};

export const getRepoData = async (
    username: string,
    repo: string,
    options: { GITHUB_API_TOKEN?: string } = {}
): Promise<{
    name: string;
    private: boolean;
    html_url: string;
    description: string;
    default_branch: string;
    avatar: string;
    language: string;
    tags: string[];
}> => {
    const { repoData, rawTags } = await getRepoDataRaw(username, repo, options);

    return {
        name: repoData.name,
        private: repoData.private === 'true',
        html_url: repoData.html_url,
        description: repoData.description,
        default_branch: repoData.default_branch,
        avatar: repoData.owner.avatar_url,
        language: repoData.language,
        tags: rawTags.map(rawTag => rawTag.name)
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
    filterPatterns: RegExp[] = [],
    maxBufferSize = DEFAULT_MAX_BUFFER_SIZE_MB * BYTES_IN_MB
): Promise<{ path: string; content: string }[]> => {
    if (Buffer.byteLength(buffer) > maxBufferSize) {
        throw new Error('Buffer too large.');
    }

    const entries = new Zip(buffer).getEntries();

    const [rootDir] = entries
        .filter(entry => entry.isDirectory)
        .map(entry => entry.entryName);

    const files = entries
        .filter(entry => !entry.isDirectory)
        .filter(entry =>
            filterPatterns.some(pattern => entry.entryName.match(pattern))
        );

    return files.map(entry => ({
        path: entry.entryName.replace(new RegExp(`^${rootDir}`), ''),
        content: entry.getData().toString()
    }));
};

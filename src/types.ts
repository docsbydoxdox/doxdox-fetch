export interface RepoData {
    name: string;
    private: boolean;
    html_url: string;
    description: string;
    default_branch: string;
    language: 'JavaScript';
}

export interface RawTag {
    name: string;
}

export interface Repo extends RepoData {
    tags: string[];
}

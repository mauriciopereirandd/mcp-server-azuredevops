export const adoEndpoints = {
  pr: {
    create: (repositoryEncoded: string) => `git/repositories/${repositoryEncoded}/pullrequests`,
    web: (repositoryEncoded: string, pullRequestId: number) => `_git/${repositoryEncoded}/pullrequest/${pullRequestId}`,
  },
  workItems: {
    edit: (id: number) => `_workitems/edit/${id}`,
  },
  wiki: {
    list: () => "wiki/wikis",
    pageByPath: (wikiIdentifierEncoded: string) => `wiki/wikis/${wikiIdentifierEncoded}/pages`,
    pageByResourceId: (wikiIdentifierEncoded: string, pageId: number) =>
      `wiki/wikis/${wikiIdentifierEncoded}/pages/${pageId}`,
  },
};
/* eslint-disable max-len */
const assert = require('assert');

const {
  getPullRequestsToReview,
  getPullRequestsWithoutLabel,
  getPullRequestsReviewersCount,
  createPr2UserArray,
  checkGithubProviderFormat,
  stringToObject,
  prettyMessage,
  getTeamsMentions,
  formatSlackMessage,
  formatTeamsMessage,
} = require('../functions');

const mockPullRequests = [
  {
    number: 1,
    title: 'Title1',
    html_url: 'https://example.com/1',
    requested_reviewers: [
      {
        login: 'User1',
      },
      {
        login: 'User2',
      },
    ],
    requested_teams: [],
  },
  {
    number: 2,
    title: 'Title2',
    html_url: 'https://example.com/2',
    requested_reviewers: [],
    requested_teams: [],
  },
  {
    number: 3,
    title: 'Title3',
    html_url: 'https://example.com/3',
    requested_reviewers: [
      {
        login: 'User3',
      },
    ],
    requested_teams: [],
  },
  {
    number: 4,
    title: 'Title4',
    html_url: 'https://example.com/4',
    requested_reviewers: [],
    requested_teams: [
      {
        slug: 'Team1',
      },
    ],
  },
  {
    number: 5,
    title: 'Title5',
    html_url: 'https://example.com/5',
    requested_reviewers: [
      {
        login: 'User2',
      },
    ],
    requested_teams: [
      {
        slug: 'Team1',
      },
    ],
  },
];
const mockPullRequestsNoReviewers = [
  {
    number: 1,
    title: 'Title1',
    requested_reviewers: [],
    requested_teams: [],
  },
  {
    number: 2,
    title: 'Title2',
    requested_reviewers: [],
    requested_teams: [],
  },
];
const mockPullRequestsNoData = [];
const mockPr2User = [
  {
    url: 'https://example.com/1',
    title: 'Title1',
    login: 'User1',
  },
  {
    url: 'https://example.com/1',
    title: 'Title1',
    login: 'User2',
  },
  {
    url: 'https://example.com/3',
    title: 'Title3',
    login: 'User3',
  },
  {
    url: 'https://example.com/5',
    title: 'Title5',
    login: 'User2',
  },
];
const mockPr2UserWrongId = [
  {
    url: 'https://example.com/1',
    title: 'Title1',
    login: 'User1',
  },
  {
    url: 'https://example.com/1',
    title: 'Title1',
    login: 'User22',
  },
  {
    url: 'https://example.com/3',
    title: 'Title3',
    login: 'User3',
  },
  {
    url: 'https://example.com/5',
    title: 'Title5',
    login: 'User22',
  },
];
const mockStringToConvert = 'name1:ID1,name2:ID2,name3:ID3';
const mockStringToConvertOneUser = 'name1:ID1';
const mockStringToConvertMultiline = `name1:ID1,
  name2:ID2,  
  name3:ID3, name4:ID4`;
const mockStringToConvertMalformed = 'foo;bar';
const mockStringToConvertNoData = '';
const mockGithub2provider = {
  User1: 'ID123',
  User2: 'ID456',
  User3: 'ID789',
};
const mockGithub2providerMalformed = {
  User1: undefined,
  User2: undefined,
};
const mockGithub2providerNoData = {};
const mockTeamsMentions = [
  {
    type: `mention`,
    text: `<at>User1</at>`,
    mentioned: {
      id: 'ID123',
      name: 'User1',
    },
  },
  {
    type: `mention`,
    text: `<at>User2</at>`,
    mentioned: {
      id: 'ID456',
      name: 'User2',
    },
  },
  {
    type: `mention`,
    text: `<at>User3</at>`,
    mentioned: {
      id: 'ID789',
      name: 'User3',
    },
  },
  {
    type: `mention`,
    text: `<at>User2</at>`,
    mentioned: {
      id: 'ID456',
      name: 'User2',
    },
  },
];
const mockTeamsMentionsWrongIds = [
  {
    type: `mention`,
    text: `<at>User1</at>`,
    mentioned: {
      id: 'ID123',
      name: 'User1',
    },
  },
  {
    type: `mention`,
    text: `<at>User3</at>`,
    mentioned: {
      id: 'ID789',
      name: 'User3',
    },
  },
];
const mockTeamsMessageRequest = {
  type: `message`,
  attachments: [
    {
      contentType: `application/vnd.microsoft.card.adaptive`,
      content: {
        type: `AdaptiveCard`,
        body: [
          {
            type: `TextBlock`,
            text: 'Hey <at>User1</at>, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)',
            wrap: true,
          },
        ],
        $schema: `http://adaptivecards.io/schemas/adaptive-card.json`,
        version: `1.0`,
        msteams: {
          width: 'Full',
          entities: mockTeamsMentions,
        },
      },
    },
  ],
};

const mockTeamsMessageRequestNoMentions = {
  type: `message`,
  attachments: [
    {
      contentType: `application/vnd.microsoft.card.adaptive`,
      content: {
        type: `AdaptiveCard`,
        body: [
          {
            type: `TextBlock`,
            text: 'Hey @User1, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)',
            wrap: true,
          },
        ],
        $schema: `http://adaptivecards.io/schemas/adaptive-card.json`,
        version: `1.0`,
        msteams: {
          width: 'Full',
          entities: [],
        },
      },
    },
  ],
};

describe('Pull Request Reviews Reminder Action tests', () => {
  it('Should get pull requests with requested reviewers (some reviewers)', () => {
    const pullRequests = getPullRequestsToReview(mockPullRequests);
    assert.strictEqual(pullRequests.length, 4);
  });

  it('Should get pull requests with requested reviewers (no reviewers)', () => {
    const pullRequests = getPullRequestsToReview(mockPullRequestsNoReviewers);
    assert.strictEqual(pullRequests.length, 0);
  });

  it('Should get pull requests with requested reviewers (no PRs)', () => {
    const pullRequests = getPullRequestsToReview(mockPullRequestsNoData);
    assert.strictEqual(pullRequests.length, 0);
  });

  it('Should get pull requests with requested reviewers and skip those with ignore label', () => {
    mockPullRequests[1].labels = [{ name: 'ignore' }];
    mockPullRequests[2].labels = [{ name: 'ignore' }];
    mockPullRequests[3].labels = [{ name: 'ignore' }];
    const pullRequests = getPullRequestsToReview(mockPullRequests);
    assert.strictEqual(pullRequests.length, 4);
    const pullRequestsWithoutLabel = getPullRequestsWithoutLabel(pullRequests, 'ignore');
    assert.strictEqual(pullRequestsWithoutLabel.length, 2);
    delete mockPullRequests[1].labels;
    delete mockPullRequests[2].labels;
    delete mockPullRequests[3].labels;
  });

  it('Should get pull requests with requested reviewers and skip those with ignore label (array)', () => {
    mockPullRequests[1].labels = [{ name: 'ignore me' }, { name: 'test' }];
    mockPullRequests[2].labels = [{ name: 'ignore2' }];
    mockPullRequests[3].labels = [{ name: 'test' }, { name: 'ignore3' }];
    const pullRequests = getPullRequestsToReview(mockPullRequests);
    assert.strictEqual(pullRequests.length, 4);
    const pullRequestsWithoutLabel = getPullRequestsWithoutLabel(pullRequests, 'ignore1, ignore me ,ignore2 , ignore3,ignore');
    assert.strictEqual(pullRequestsWithoutLabel.length, 2);
    delete mockPullRequests[1].labels;
    delete mockPullRequests[2].labels;
    delete mockPullRequests[3].labels;
  });

  it('Should count the total number of reviewers in the pull requests', () => {
    const total = getPullRequestsReviewersCount(mockPullRequests);
    assert.strictEqual(total, 4);
  });

  it('Should create the array with pr and users (some reviewers)', () => {
    const array = createPr2UserArray(mockPullRequests);
    assert.strictEqual(array.length, 6);
    assert.strictEqual(array[0].login, 'User1');
    assert.strictEqual(array[0].url, 'https://example.com/1');
    assert.strictEqual(array[1].login, 'User2');
    assert.strictEqual(array[1].url, 'https://example.com/1');
    assert.strictEqual(array[2].login, 'User3');
    assert.strictEqual(array[2].url, 'https://example.com/3');
    assert.strictEqual(array[3].login, 'Team1');
    assert.strictEqual(array[3].url, 'https://example.com/4');
    assert.strictEqual(array[4].login, 'User2');
    assert.strictEqual(array[4].url, 'https://example.com/5');
    assert.strictEqual(array[5].login, 'Team1');
    assert.strictEqual(array[5].url, 'https://example.com/5');
  });

  it('Should create the array with pr and users (no reviewers)', () => {
    const array = createPr2UserArray(mockPullRequestsNoReviewers);
    assert.strictEqual(array.length, 0);
  });

  it('Should create the array with pr and users (no PRs)', () => {
    const array = createPr2UserArray(mockPullRequestsNoData);
    assert.strictEqual(array.length, 0);
  });

  it('Should check the validity of the github-provider-map string', () => {
    // Asserts made with the help of ChatGPT
    assert.ok(checkGithubProviderFormat('name1:ID123,name2:ID456'));
    assert.ok(!checkGithubProviderFormat(''));
    assert.ok(checkGithubProviderFormat('name1:ID123'));
    assert.ok(checkGithubProviderFormat(`name1:ID123,
    name2:ID456,
      name3:ID3,  name4:ID4,
    name5:Id5`));
    assert.ok(checkGithubProviderFormat('name1:ID123, name2:ID456'));
    assert.ok(checkGithubProviderFormat('name1:asd@example.com,name2:qwe@example.it'));
    assert.ok(checkGithubProviderFormat('DavideViolante:admin@DavideViolante.onmicrosoft.com, name2:qwe@example.it'));
    assert.ok(checkGithubProviderFormat(`name1:asd@example.com,
    name2:qwe@example.it`));
    assert.ok(!checkGithubProviderFormat('name1ID123,name2:ID456'));
    assert.ok(!checkGithubProviderFormat('name1:ID123name2:ID456'));
    assert.ok(!checkGithubProviderFormat('name1ID123,name2ID456'));
  });

  it('Should create an object from a string', () => {
    const obj = stringToObject(mockStringToConvert);
    assert.strictEqual(typeof obj, 'object');
    assert.strictEqual(obj.name1, 'ID1');
    assert.strictEqual(obj.name2, 'ID2');
    assert.strictEqual(obj.name3, 'ID3');
  });

  it('Should create an object from a string (one user)', () => {
    const obj = stringToObject(mockStringToConvertOneUser);
    assert.strictEqual(typeof obj, 'object');
    assert.strictEqual(obj.name1, 'ID1');
  });

  it('Should create an object from a string (multiline)', () => {
    const obj = stringToObject(mockStringToConvertMultiline);
    assert.strictEqual(typeof obj, 'object');
    assert.strictEqual(obj.name1, 'ID1');
    assert.strictEqual(obj.name2, 'ID2');
    assert.strictEqual(obj.name3, 'ID3');
    assert.strictEqual(obj.name4, 'ID4');
  });

  it('Should create an object from a string (malformed)', () => {
    const obj = stringToObject(mockStringToConvertMalformed);
    assert.strictEqual(typeof obj, 'object');
  });

  it('Should create an object from a string (empty)', () => {
    const obj = stringToObject(mockStringToConvertNoData);
    assert.strictEqual(typeof obj, 'object');
  });

  it('Should print the pretty message, one reviewer per row, Slack (correct map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2provider, 'slack');
    const [aRow, bRow, cRow, dRow] = message.split('\n');
    assert.strictEqual(aRow, 'Hey <@ID123>, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(bRow, 'Hey <@ID456>, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(cRow, 'Hey <@ID789>, the PR "Title3" is waiting for your review: https://example.com/3');
    assert.strictEqual(dRow, 'Hey <@ID456>, the PR "Title5" is waiting for your review: https://example.com/5');
  });

  it('Should print the pretty message, one reviewer per row, Slack (malformed map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2providerMalformed, 'slack');
    const [aRow, bRow, cRow, dRow] = message.split('\n');
    assert.strictEqual(aRow, 'Hey @User1, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(bRow, 'Hey @User2, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(cRow, 'Hey @User3, the PR "Title3" is waiting for your review: https://example.com/3');
    assert.strictEqual(dRow, 'Hey @User2, the PR "Title5" is waiting for your review: https://example.com/5');
  });

  it('Should print the pretty message, one reviewer per row, Slack (no map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2providerNoData, 'slack');
    const [aRow, bRow, cRow, dRow] = message.split('\n');
    assert.strictEqual(aRow, 'Hey @User1, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(bRow, 'Hey @User2, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(cRow, 'Hey @User3, the PR "Title3" is waiting for your review: https://example.com/3');
    assert.strictEqual(dRow, 'Hey @User2, the PR "Title5" is waiting for your review: https://example.com/5');
  });

  it('Should print the pretty message, one reviewer per row, Teams (correct map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2provider, 'msteams');
    const [aRow, bRow, cRow, dRow] = message.split('  \n');
    assert.strictEqual(aRow, 'Hey <at>User1</at>, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(bRow, 'Hey <at>User2</at>, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(cRow, 'Hey <at>User3</at>, the PR "Title3" is waiting for your review: [https://example.com/3](https://example.com/3)');
    assert.strictEqual(dRow, 'Hey <at>User2</at>, the PR "Title5" is waiting for your review: [https://example.com/5](https://example.com/5)');
  });

  it('Should print the pretty message, one reviewer per row, Teams (correct map, wrong ids)', () => {
    const message = prettyMessage(mockPr2UserWrongId, mockGithub2provider, 'msteams');
    const [aRow, bRow, cRow, dRow] = message.split('  \n');
    assert.strictEqual(aRow, 'Hey <at>User1</at>, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(bRow, 'Hey @User22, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(cRow, 'Hey <at>User3</at>, the PR "Title3" is waiting for your review: [https://example.com/3](https://example.com/3)');
    assert.strictEqual(dRow, 'Hey @User22, the PR "Title5" is waiting for your review: [https://example.com/5](https://example.com/5)');
  });

  it('Should print the pretty message, one reviewer per row, Teams (malformed map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2providerMalformed, 'msteams');
    const [aRow, bRow, cRow, dRow] = message.split('  \n');
    assert.strictEqual(aRow, 'Hey @User1, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(bRow, 'Hey @User2, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(cRow, 'Hey @User3, the PR "Title3" is waiting for your review: [https://example.com/3](https://example.com/3)');
    assert.strictEqual(dRow, 'Hey @User2, the PR "Title5" is waiting for your review: [https://example.com/5](https://example.com/5)');
  });

  it('Should print the pretty message, one reviewer per row, Teams (no map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2providerNoData, 'msteams');
    const [aRow, bRow, cRow, dRow] = message.split('  \n');
    assert.strictEqual(aRow, 'Hey @User1, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(bRow, 'Hey @User2, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(cRow, 'Hey @User3, the PR "Title3" is waiting for your review: [https://example.com/3](https://example.com/3)');
    assert.strictEqual(dRow, 'Hey @User2, the PR "Title5" is waiting for your review: [https://example.com/5](https://example.com/5)');
  });

  it('Should create mentions array, Teams', () => {
    const mentions = getTeamsMentions(mockGithub2provider, mockPr2User);
    assert.deepEqual(mentions, mockTeamsMentions);
  });

  it('Should create mentions array, wrong IDs, Teams', () => {
    const mentions = getTeamsMentions(mockGithub2provider, mockPr2UserWrongId);
    assert.deepEqual(mentions, mockTeamsMentionsWrongIds);
  });

  it('Should create empty mentions array, Teams', () => {
    const mentions = getTeamsMentions({}, mockPr2User);
    assert.deepEqual(mentions, []);
  });

  it('Should format a Slack message to send the request', () => {
    const channel = '#developers';
    const message = 'Hey @User1, the PR "Title1" is waiting for your review: https://example.com/1';
    const slackMessageRequest = formatSlackMessage(channel, message);
    const expectedSlackMessageRequest = {
      channel: '#developers',
      username: 'Pull Request reviews reminder',
      text: 'Hey @User1, the PR "Title1" is waiting for your review: https://example.com/1',
    };
    assert.deepEqual(slackMessageRequest, expectedSlackMessageRequest);
  });

  it('Should format a Teams message to send the request', () => {
    const message = `Hey <at>User1</at>, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)`;
    const teamsMessageRequest = formatTeamsMessage(message, mockTeamsMentions);
    assert.deepEqual(teamsMessageRequest, mockTeamsMessageRequest);
  });

  it('Should format a Teams message to send the request (no mentions array)', () => {
    const message = `Hey @User1, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)`;
    const teamsMessageRequest = formatTeamsMessage(message);
    assert.deepEqual(teamsMessageRequest, mockTeamsMessageRequestNoMentions);
  });
});

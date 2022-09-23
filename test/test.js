/* eslint-disable max-len */
const assert = require('assert');

const {
  getPullRequestsToReview,
  createPr2UserArray,
  stringToObject,
  prettyMessage,
  getMsTeamsMentions,
  formatSlackMessage,
  formatMsTeamsMessage,
} = require('../functions');

const provider = 'slack';
// Mock milestones are ordered by due_on desc by GitHub APIs (no need to test it)
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
        login: 'User3',
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
];
const mockStringToConvert = 'name1:ID1,name2:ID2,name3:ID3';
const mockStringToConvertOneUser = 'name1:ID1';
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
    assert.strictEqual(array[4].login, 'User3');
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

  it('Should create an object from a string (malformed)', () => {
    const obj = stringToObject(mockStringToConvertMalformed);
    assert.strictEqual(typeof obj, 'object');
  });

  it('Should create an object from a string (empty)', () => {
    const obj = stringToObject(mockStringToConvertNoData);
    assert.strictEqual(typeof obj, 'object');
  });

  it('Should print the pretty message, one reviewer per row (correct map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2provider, provider);
    const [firstRow, secondRow, thirdRow] = message.split('\n');
    assert.strictEqual(firstRow, 'Hey <@ID123>, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(secondRow, 'Hey <@ID456>, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(thirdRow, 'Hey <@ID789>, the PR "Title3" is waiting for your review: https://example.com/3');
  });

  it('Should print the pretty message, one reviewer per row (malformed map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2providerMalformed, provider);
    const [firstRow, secondRow] = message.split('\n');
    assert.strictEqual(firstRow, 'Hey @User1, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(secondRow, 'Hey @User2, the PR "Title1" is waiting for your review: https://example.com/1');
  });

  it('Should print the pretty message, one reviewer per row (no map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2providerNoData, provider);
    const [firstRow, secondRow, thirdRow] = message.split('\n');
    assert.strictEqual(firstRow, 'Hey @User1, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(secondRow, 'Hey @User2, the PR "Title1" is waiting for your review: https://example.com/1');
    assert.strictEqual(thirdRow, 'Hey @User3, the PR "Title3" is waiting for your review: https://example.com/3');
  });

  it('Should print the pretty message, one reviewer per row (no map), MS Teams', () => {
    const message = prettyMessage(mockPr2User, mockGithub2providerNoData, 'msteams');
    const [firstRow, secondRow, thirdRow] = message.split('  \n');
    assert.strictEqual(firstRow, 'Hey @User1, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(secondRow, 'Hey @User2, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(thirdRow, 'Hey @User3, the PR "Title3" is waiting for your review: [https://example.com/3](https://example.com/3)');
  });

  it('Should print the pretty message, one reviewer per row, MS Teams', () => {
    const message = prettyMessage(mockPr2User, mockGithub2provider, 'msteams');
    const [firstRow, secondRow, thirdRow] = message.split('  \n');
    assert.strictEqual(firstRow, 'Hey <at>User1 UPN</at>, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(secondRow, 'Hey <at>User2 UPN</at>, the PR "Title1" is waiting for your review: [https://example.com/1](https://example.com/1)');
    assert.strictEqual(thirdRow, 'Hey <at>User3 UPN</at>, the PR "Title3" is waiting for your review: [https://example.com/3](https://example.com/3)');
  });

  it('Should create MS Teams mention objects in the correct shape with the correct data', () => {
    const msTeamsMentionObjects = getMsTeamsMentions(mockGithub2provider, mockPr2User);
    assert.deepEqual(msTeamsMentionObjects, [
      {
        type: 'mention',
        text: `<at>User1 UPN</at>`,
        mentioned: {
          id: 'ID123',
          name: 'User1',
        },
      },
      {
        type: 'mention',
        text: `<at>User2 UPN</at>`,
        mentioned: {
          id: 'ID456',
          name: 'User2',
        },
      },
      {
        type: 'mention',
        text: `<at>User3 UPN</at>`,
        mentioned: {
          id: 'ID789',
          name: 'User3',
        },
      },
    ]);
  });

  it('Should not create MS Teams mention objects for users without reviews requested', () => {
    const msTeamsMentionObjects = getMsTeamsMentions(mockGithub2provider, [mockPr2User[0]]);
    assert.deepEqual(msTeamsMentionObjects, [
      {
        type: 'mention',
        text: `<at>User1 UPN</at>`,
        mentioned: {
          id: 'ID123',
          name: 'User1',
        },
      },
    ]);
  });

  it('Should format a Slack request object properly', () => {
    const channel = 'testChannel';
    const message = 'testMessage';
    const slackMessageObject = formatSlackMessage(channel, message);

    assert.deepEqual(slackMessageObject, {
      channel: 'testChannel',
      username: 'Pull Request reviews reminder',
      text: 'testMessage',
    });
  });

  it('Should send a properly structured MS Teams message', () => {
    const message = 'testMessage';
    const mentionObjects = [{ test: 'data' }];
    const msTeamsMessageObject = formatMsTeamsMessage(message, mentionObjects);

    assert.deepEqual(msTeamsMessageObject, {
      type: `message`,
      attachments: [
        {
          contentType: `application/vnd.microsoft.card.adaptive`,
          content: {
            type: `AdaptiveCard`,
            body: [
              {
                type: `TextBlock`,
                text: 'testMessage',
                wrap: true,
              },
            ],
            $schema: `http://adaptivecards.io/schemas/adaptive-card.json`,
            version: `1.0`,
            msteams: {
              width: 'Full',
              entities: [{ test: 'data' }],
            },
          },
        },
      ],
    });
  });
});

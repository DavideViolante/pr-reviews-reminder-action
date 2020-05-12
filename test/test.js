const assert = require('assert');

const {
  getPullRequestsWithRequestedReviewers,
  createPr2UserArray,
  stringToObject,
  prettyMessage
} = require("../functions");

// Mock milestones are ordered by due_on desc by GitHub APIs (no need to test it)
const mockPullRequests = [
  {
    number: 1,
    html_url: 'https://example.com/1',
    requested_reviewers: [
      {
        login: 'User1'
      },
      {
        login: 'User2'
      }
    ]
  },
  {
    number: 2,
    html_url: 'https://example.com/2',
    requested_reviewers: []
  },
  {
    number: 3,
    html_url: 'https://example.com/3',
    requested_reviewers: [
      {
        login: 'User3'
      }
    ]
  }
];
const mockPullRequestsNoReviewers = [
  {
    number: 1,
    requested_reviewers: []
  },
  {
    number: 2,
    requested_reviewers: []
  }
];
const mockPullRequestsNoData = [];
const mockPr2User = [
  {
    login: 'User1',
    url: 'https://example.com/1'
  },
  {
    login: 'User2',
    url: 'https://example.com/1'
  },
  {
    login: 'User3',
    url: 'https://example.com/3'
  }
];
const mockStringToConvert = 'name1:ID1,name2:ID2,name3:ID3';
const mockStringToConvertOneUser = 'name1:ID1';
const mockStringToConvertMalformed = 'foo;bar';
const mockStringToConvertNoData = '';
const mockGithub2Slack = {
  User1: 'ID123',
  User2: 'ID456',
  User3: 'ID789'
};
const mockGithub2SlackMalformed = {
  User1: undefined,
  User2: undefined
}
const mockGithub2SlackNoData = {};

describe('Pull Request Reviews Reminder Action tests', () => {
  
  it('Should get pull requests with requested reviewers (some reviewers)', () => {
    const pullRequests = getPullRequestsWithRequestedReviewers(mockPullRequests);
    assert.equal(pullRequests.length, 2);
  });

  it('Should get pull requests with requested reviewers (no reviewers)', () => {
    const pullRequests = getPullRequestsWithRequestedReviewers(mockPullRequestsNoReviewers);
    assert.equal(pullRequests.length, 0);
  });
  
  it('Should get pull requests with requested reviewers (no PRs)', () => {
    const pullRequests = getPullRequestsWithRequestedReviewers(mockPullRequestsNoData);
    assert.equal(pullRequests.length, 0);
  });

  it('Should create the array with pr and users (some reviewers)', () => {
    const array = createPr2UserArray(mockPullRequests);
    assert.equal(array.length, 3);
    assert.equal(array[0].login, 'User1');
    assert.equal(array[0].url, 'https://example.com/1');
    assert.equal(array[1].login, 'User2');
    assert.equal(array[1].url, 'https://example.com/1');
    assert.equal(array[2].login, 'User3');
    assert.equal(array[2].url, 'https://example.com/3');
  });

  it('Should create the array with pr and users (no reviewers)', () => {
    const array = createPr2UserArray(mockPullRequestsNoReviewers);
    assert.equal(array.length, 0);
  });

  it('Should create the array with pr and users (no PRs)', () => {
    const array = createPr2UserArray(mockPullRequestsNoData);
    assert.equal(array.length, 0);
  });

  it('Should create an object from a string', () => {
    const obj = stringToObject(mockStringToConvert);
    assert.equal(typeof obj, 'object');
    assert.equal(obj.name1, 'ID1');
    assert.equal(obj.name2, 'ID2');
    assert.equal(obj.name3, 'ID3');
  });

  it('Should create an object from a string (one user)', () => {
    const obj = stringToObject(mockStringToConvertOneUser);
    assert.equal(typeof obj, 'object');
    assert.equal(obj.name1, 'ID1');
  });

  it('Should create an object from a string (malformed)', () => {
    const obj = stringToObject(mockStringToConvertMalformed);
    assert.equal(typeof obj, 'object');
  });

  it('Should create an object from a string (empty)', () => {
    const obj = stringToObject(mockStringToConvertNoData);
    assert.equal(typeof obj, 'object');
  });

  it('Should print the pretty message, one reviewer per row (correct map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2Slack);
    const [firstRow, secondRow, thirdRow] = message.split('\n');
    assert.equal(firstRow, 'Hey <@ID123>, this PR is waiting for your review: https://example.com/1');
    assert.equal(secondRow, 'Hey <@ID456>, this PR is waiting for your review: https://example.com/1');
    assert.equal(thirdRow, 'Hey <@ID789>, this PR is waiting for your review: https://example.com/3');
  });

  it('Should print the pretty message, one reviewer per row (malformed map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2SlackMalformed);
    const [firstRow, secondRow] = message.split('\n');
    assert.equal(firstRow, 'Hey @User1, this PR is waiting for your review: https://example.com/1');
    assert.equal(secondRow, 'Hey @User2, this PR is waiting for your review: https://example.com/1');
  });

  it('Should print the pretty message, one reviewer per row (no map)', () => {
    const message = prettyMessage(mockPr2User, mockGithub2SlackNoData);
    const [firstRow, secondRow, thirdRow] = message.split('\n');
    assert.equal(firstRow, 'Hey @User1, this PR is waiting for your review: https://example.com/1');
    assert.equal(secondRow, 'Hey @User2, this PR is waiting for your review: https://example.com/1');
    assert.equal(thirdRow, 'Hey @User3, this PR is waiting for your review: https://example.com/3');
  });

});

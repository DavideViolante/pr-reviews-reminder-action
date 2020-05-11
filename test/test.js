const assert = require('assert');

const { getPullRequestsWithRequestedReviewers, createPr2UserArray, prettyMessage } = require("../functions");

// Mock milestones are ordered by due_on desc by GitHub APIs (no need to test it)
const mockPullRequests = [
  {
    number: 1,
    html_url: 'https://example.com/1',
    requested_reviewers: [
      {
        login: 'User 1'
      },
      {
        login: 'User 2'
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
        login: 'User 3'
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
    login: 'User 1',
    url: 'https://example.com/1'
  },
  {
    login: 'User 2',
    url: 'https://example.com/1'
  },
  {
    login: 'User 3',
    url: 'https://example.com/3'
  }
];

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
    assert.equal(array[0].login, 'User 1');
    assert.equal(array[0].url, 'https://example.com/1');
    assert.equal(array[1].login, 'User 2');
    assert.equal(array[1].url, 'https://example.com/1');
    assert.equal(array[2].login, 'User 3');
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

  it('Should print the pretty message, one reviewer per row (some reviewers)', () => {
    const message = prettyMessage(mockPr2User);
    const [firstRow, secondRow, thirdRow] = message.split('\n');
    assert.equal(firstRow, 'Hey *User 1*, this PR is waiting for your review: https://example.com/1');
    assert.equal(secondRow, 'Hey *User 2*, this PR is waiting for your review: https://example.com/1');
    assert.equal(thirdRow, 'Hey *User 3*, this PR is waiting for your review: https://example.com/3');
  });

  it('Should print the pretty message, one reviewer per row (no reviewers, no PRs)', () => {
    const message = prettyMessage(mockPullRequestsNoData);
    assert.equal(message, '');
  });

});

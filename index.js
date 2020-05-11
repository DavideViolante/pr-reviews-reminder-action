
const core = require('@actions/core');
const axios = require('axios');

const { getPullRequestsWithRequestedReviewers, createPr2UserArray, prettyMessage } = require("./functions");

const GITHUB_API_URL = 'https://api.github.com';
const { GITHUB_TOKEN, GITHUB_REPOSITORY } = process.env;
const AUTH_HEADER = {
  Authorization: `token ${GITHUB_TOKEN}`
};
const PULLS_ENDPOINT = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls`;

function getPullRequests() {
  return axios({
    method: 'GET',
    url: PULLS_ENDPOINT,
    headers: AUTH_HEADER
  });
}

function sendNotification(slackWehookUrl, slackChannel, message) {
  return axios({
    method: 'POST',
    url: slackWehookUrl,
    data: {
      channel: slackChannel,
      username: 'Pull Request reviews reminder',
      text: message,
    }
  });
}

async function main() {
  try {
    const slackWehookUrl = core.getInput('slack-webhook-url');
    const slackChannel = core.getInput('slack-channel');
    core.info('Getting open pull requests...');
    const pullRequests = await getPullRequests();
    core.info(`There are ${pullRequests.data.length} open pull requests`);
    const pullRequestsWithRequestedReviewers = getPullRequestsWithRequestedReviewers(pullRequests.data);
    core.info(`There are ${pullRequestsWithRequestedReviewers.length} waiting for a review`);
    const pr2user = createPr2UserArray(pullRequestsWithRequestedReviewers);
    const message = prettyMessage(pr2user);
    await sendNotification(slackWehookUrl, slackChannel, message);
    core.info(`Notification sent successfully!`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();

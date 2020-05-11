const core = require('@actions/core');
const axios = require('axios');

const GITHUB_API_URL = 'https://api.github.com';
const { GITHUB_TOKEN, GITHUB_REPOSITORY, SLACK_WEBHOOK_URL, SLACK_CHANNEL } = process.env;
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

function getPullRequestsWithRequestedReview(pullRequests) {
  return pullRequests.filter(pr => pr.requested_reviewers.length);
}

function prettyMessage(pr2user) {
  let message = '';
  for (const obj of pr2user) {
    message += `Hey *${obj.login}*, this PR is waiting for your review: ${obj.url}\n`;
  }
  return message;
}

function sendNotification(message) {
  return axios({
    method: 'POST',
    url: SLACK_WEBHOOK_URL,
    data: {
      channel: SLACK_CHANNEL,
      username: 'Pull Request reviews reminder',
      text: message,
    }
  });
}

async function main() {
  try {
    //const sprintDuration = core.getInput('sprint-duration'); // Default is 1
    core.info('Getting open pull requests...');
    const pullRequests = await getPullRequests();
    core.info(`There are ${pullRequests.data.length} open pull requests`);
    const pullRequestsWithRequestedReview = getPullRequestsWithRequestedReview(pullRequests.data);
    core.info(`There are ${pullRequestsWithRequestedReview.length} waiting for a review`);
    const pr2user = [];
    for (const pr of pullRequestsWithRequestedReview) {
      for (const user of pr.requested_reviewers) {
        pr2user.push({ url: pr.html_url, login: user.login });
      }
    }
    const message = prettyMessage(pr2user);
    await sendNotification(message);
    core.info(`Notification sent successfully!`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();


const core = require('@actions/core');
const axios = require('axios');

const {
  getPullRequestsToReview,
  createPr2UserArray,
  prettyMessage,
  stringToObject,
  getMsTeamsMentions,
  formatSlackMessage,
  formatMsTeamsMessage,
} = require('./functions');

const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_API_URL } = process.env;
const AUTH_HEADER = {
  Authorization: `token ${GITHUB_TOKEN}`,
};
const PULLS_ENDPOINT = `${GITHUB_API_URL}/repos/${GITHUB_REPOSITORY}/pulls`;

/**
 * Get Pull Requests from GitHub repository
 * @return {Array} List of Pull Requests
 */
function getPullRequests() {
  return axios({
    method: 'GET',
    url: PULLS_ENDPOINT,
    headers: AUTH_HEADER,
  });
}

/**
 * Send notification to a channel
 * @param {String} webhookUrl Webhook URL
 * @param {String} channel Channel to send the notification to
 * @param {String} messageData Message data object to send into the channel
 * @return {void}
 */
function sendNotification(webhookUrl, channel, messageData) {
  return axios({
    method: 'POST',
    url: webhookUrl,
    data: messageData,
  });
}

/**
 * Main function for the GitHub Action
 */
async function main() {
  try {
    const webhookUrl = core.getInput('webhook-url');
    const provider = core.getInput('provider');
    const channel = core.getInput('channel');
    const github2providerString = core.getInput('github-provider-map');
    core.info('Getting open pull requests...');
    const pullRequests = await getPullRequests();
    core.info(`There are ${pullRequests.data.length} open pull requests`);
    const pullRequestsToReview = getPullRequestsToReview(pullRequests.data);
    core.info(`There are ${pullRequestsToReview.length} pull requests waiting for reviews`);
    if (pullRequestsToReview.length) {
      const pr2user = createPr2UserArray(pullRequestsToReview);
      const github2provider = stringToObject(github2providerString);
      const messageText = prettyMessage(pr2user, github2provider, provider);
      let messageObject;

      switch (provider) {
        case 'slack':
          messageObject = formatSlackMessage(channel, message);
        case 'msteams': {
          const msTeamsMentions = getMsTeamsMentions(github2provider, pr2user);
          messageObject = formatMsTeamsMessage(messageText, msTeamsMentions);
        }
      }

      sendNotification(webhookUrl, messageObject);
      core.info(`Notification sent successfully!`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();

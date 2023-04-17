/**
 * Filter Pull Requests with requested reviewers only
 * @param {Array} pullRequests Pull Requests to filter
 * @return {Array} Pull Requests to review
 */
function getPullRequestsToReview(pullRequests) {
  return pullRequests.filter((pr) => pr.requested_reviewers.length || pr.requested_teams.length);
}

/**
 * Filter Pull Requests without a specific label
 * @param {Array} pullRequests Pull Requests to filter
 * @param {String} ignoreLabels Pull Request label(s) to ignore
 * @return {Array} Pull Requests without a specific label
 */
function getPullRequestsWithoutLabel(pullRequests, ignoreLabels) {
  const ignoreLabelsArray = ignoreLabels.replace(/\s*,\s*/g, ',').split(','); // ['ignore1', 'ignore2', ...]
  const ignoreLabelsSet = new Set(ignoreLabelsArray);
  return pullRequests.filter((pr) => !((pr.labels || []).some((label) => ignoreLabelsSet.has(label.name))));
}

/**
 * Count Pull Requests reviewers
 * @param {Array} pullRequests Pull Requests
 * @return {Number} Reviewers number
 */
function getPullRequestsReviewersCount(pullRequests) {
  return pullRequests.reduce((total, pullRequest) => (total + pullRequest.requested_reviewers.length), 0);
}

/**
 * Create an Array of Objects with { url, title, login } properties from a list of Pull Requests
 * @param {Array} pullRequestsToReview Pull Requests
 * @return {Array} Array of Objects with { url, title, login } properties
 */
function createPr2UserArray(pullRequestsToReview) {
  const pr2user = [];
  for (const pr of pullRequestsToReview) {
    for (const user of pr.requested_reviewers) {
      pr2user.push({
        url: pr.html_url,
        title: pr.title,
        login: user.login,
      });
    }
    for (const team of pr.requested_teams) {
      pr2user.push({
        url: pr.html_url,
        title: pr.title,
        login: team.slug,
      });
    }
  }
  return pr2user;
}

/**
 * Check if the github-provider-map string is in correct format
 * @param {String} str String to be checked to be in correct format
 * @return {Boolean} String validity as boolean
 */
function checkGithubProviderFormat(str) {
  // Pattern made with the help of ChatGPT
  const az09 = '[A-z0-9_\\-@\\.]+';
  const pattern = new RegExp(`^${az09}:${az09}(,\\s*${az09}:${az09})*$`, 'm');
  return pattern.test(str);
}

/**
 * Convert a string like "name1:ID123,name2:ID456" to an Object { name1: "ID123", name2: "ID456"}
 * @param {String} str String to convert to Object
 * @return {Object} Object with usernames as properties and IDs as values
 */
function stringToObject(str) {
  const map = {};
  if (!str) {
    return map;
  }
  const users = str.replace(/[\s\r\n]+/g, '').split(',');
  users.forEach((user) => {
    const [github, provider] = user.split(':');
    map[github] = provider;
  });
  return map;
}

/**
 * Create a pretty message to print
 * @param {Array} pr2user Array of Object with these properties { url, title, login }
 * @param {Object} github2provider Object containing usernames as properties and IDs as values
 * @param {String} provider Service to use: slack or msteams
 * @return {String} Pretty message to print
 */
function prettyMessage(pr2user, github2provider, provider) {
  let message = '';
  for (const obj of pr2user) {
    switch (provider) {
      case 'slack': {
        const mention = github2provider[obj.login] ?
          `<@${github2provider[obj.login]}>` :
          `@${obj.login}`;
        message += `Hey ${mention}, the PR "${obj.title}" is waiting for your review: ${obj.url}\n`;
        break;
      }
      case 'rocket': {
        const mention = github2provider[obj.login] ?
                `<@${github2provider[obj.login]}>` :
                `@${obj.login}`;
        message += `Hey ${mention}, the PR "${obj.title}" is waiting for your review: ${obj.url}\n`;
        break;
      }
      case 'msteams': {
        const mention = github2provider[obj.login] ?
          `<at>${obj.login}</at>` :
          `@${obj.login}`;
        message += `Hey ${mention}, the PR "${obj.title}" is waiting for your review: [${obj.url}](${obj.url})  \n`;
        break;
      }
    }
  }
  return message;
}

/**
 * Create an array of MS teams mention objects for users requested in a review
 * Docs: https://bit.ly/3UlOoqo
 * @param {Object} github2provider Object containing usernames as properties and IDs as values
 * @param {Array} pr2user Array of Object with these properties { url, title, login }
 * @return {Array} MS teams mention objects
 */
function getTeamsMentions(github2provider, pr2user) {
  const mentions = [];
  // Add mentions array only if the map is provided, or no notification is sent
  if (Object.keys(github2provider).length > 0) {
    for (const user of pr2user) {
      // mentioed property needs id and name, or no notification is sent
      if (github2provider[user.login]) {
        mentions.push({
          type: `mention`,
          text: `<at>${user.login}</at>`,
          mentioned: {
            id: github2provider[user.login],
            name: user.login,
          },
        });
      }
    }
  }
  return mentions;
}

/**
 * Formats channel and slack message text into a request object
 * @param {String} channel channel to send the message to
 * @param {String} message slack message text
 * @return {Object} Slack message data object
 */
function formatSlackMessage(channel, message) {
  const messageData = {
    channel: channel,
    username: 'Pull Request reviews reminder',
    text: message,
  };
  return messageData;
}

/**
 * Formats channel and rocket message text into a request object
 * @param {String} channel channel to send the message to
 * @param {String} message rocket message text
 * @return {Object} rocket message data object
 */
function formatRocketMessage(channel, message) {
  const messageData = {
    channel: channel,
    username: 'Pull Request reviews reminder',
    text: message,
  };
  return messageData;
}

/**
 * Format the MS Teams message request object
 * Docs: https://bit.ly/3UlOoqo
 * @param {String} message formatted message string
 * @param {Array} [mentionsArray] teams mention objects array
 * @return {Object} Ms Teams message data object
 */
function formatTeamsMessage(message, mentionsArray = []) {
  const messageData = {
    type: `message`,
    attachments: [
      {
        contentType: `application/vnd.microsoft.card.adaptive`,
        content: {
          type: `AdaptiveCard`,
          body: [
            {
              type: `TextBlock`,
              text: message,
              wrap: true,
            },
          ],
          $schema: `http://adaptivecards.io/schemas/adaptive-card.json`,
          version: `1.0`,
          msteams: {
            width: 'Full',
            entities: mentionsArray,
          },
        },
      },
    ],
  };

  return messageData;
}

module.exports = {
  getPullRequestsToReview,
  getPullRequestsWithoutLabel,
  getPullRequestsReviewersCount,
  createPr2UserArray,
  checkGithubProviderFormat,
  stringToObject,
  prettyMessage,
  getTeamsMentions,
  formatTeamsMessage,
  formatRocketMessage,
  formatSlackMessage,
};

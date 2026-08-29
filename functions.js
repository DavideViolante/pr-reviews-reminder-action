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
 * Format the message to print
 * @param {String} mention Username to mention as the reviewer
 * @param {String} title PR title
 * @param {String} url PR URL
 * @param {String} messageTemplate Message template to render
 * @return {String} Formatted message
 */
function formatMessage(mention, title, url, messageTemplate) {
  return messageTemplate
    .replaceAll('{mention}', mention)
    .replaceAll('{title}', title)
    .replaceAll('{url}', url);
}

/**
 * Get the mention string formatted for the given provider
 * @param {String} login GitHub username or team slug
 * @param {String} provider Service to use: slack, rocket or msteams
 * @param {Object} github2provider Object containing usernames as properties and IDs as values
 * @return {String} Formatted mention
 */
function getMention(login, provider, github2provider) {
  switch (provider) {
    case 'slack':
    case 'rocket':
      return github2provider[login] ? `<@${github2provider[login]}>` : `@${login}`;
    case 'msteams':
      return github2provider[login] ? `<at>${login}</at>` : `@${login}`;
    default:
      return `@${login}`;
  }
}

/**
 * Format a single Pull Request row for the given provider, including its line terminator
 * @param {Object} obj Object with these properties { url, title, login }
 * @param {String} mention Formatted mention
 * @param {String} provider Service to use: slack, rocket or msteams
 * @param {String} messageTemplate Message template to render
 * @return {String} Formatted row
 */
function formatRow(obj, mention, provider, messageTemplate) {
  if (provider === 'msteams') {
    const url = `[${obj.url}](${obj.url})`;
    return formatMessage(mention, obj.title, url, messageTemplate) + '  \n';
  }
  return formatMessage(mention, obj.title, obj.url, messageTemplate) + '\n';
}

/**
 * Create a pretty message to print
 * @param {Array} pr2user Array of Object with these properties { url, title, login }
 * @param {Object} github2provider Object containing usernames as properties and IDs as values
 * @param {String} provider Service to use: slack, rocket or msteams
 * @param {String} messageTemplate Message template to render
 * @param {Boolean} [aggregatePerMention] Group the rows by mention instead of listing them one PR per row
 * @return {String} Pretty message to print
 */
function prettyMessage(pr2user, github2provider, provider, messageTemplate, aggregatePerMention) {
  if (!messageTemplate) {
    messageTemplate = 'Hey {mention}, the PR "{title}" is waiting for your review: {url}';
  }

  if (aggregatePerMention) {
    const loginToPrs = Object.create(null);
    for (const obj of pr2user) {
      if (!loginToPrs[obj.login]) {
        loginToPrs[obj.login] = [];
      }
      loginToPrs[obj.login].push(obj);
    }

    let message = '';
    for (const login of Object.keys(loginToPrs)) {
      const prs = loginToPrs[login];
      const mention = getMention(login, provider, github2provider);
      message += `${mention} (${prs.length} pull requests):\n`;
      for (const obj of prs) {
        message += formatRow(obj, mention, provider, messageTemplate);
      }
    }
    return message;
  }

  let message = '';
  for (const obj of pr2user) {
    const mention = getMention(obj.login, provider, github2provider);
    message += formatRow(obj, mention, provider, messageTemplate);
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

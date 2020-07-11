function getPullRequestsWithRequestedReviewers(pullRequests) {
  return pullRequests.filter(pr => pr.requested_reviewers.length);
}

function createPr2UserArray(pullRequestsWithRequestedReview) {
  const pr2user = [];
  for (const pr of pullRequestsWithRequestedReview) {
    for (const user of pr.requested_reviewers) {
      pr2user.push({ url: pr.html_url, login: user.login });
    }
  }
  return pr2user;
}

// Convert string like "davideviolante:ID123,foobar:ID456" to 
// object like { davideviolante: "ID123", foobar: "ID456" }
function stringToObject(str) {
  const map = {};
  if (!str) {
    return map;
  }
  const users = (str || '').split(',');
  users.forEach(user => {
    const [github, provider] = user.split(':');
    map[github] = provider
  });
  return map;
}

function prettyMessage(pr2user, github2provider) {
  let message = '';
  for (const obj of pr2user) {
    const mention = github2provider[obj.login] ? `<@${github2provider[obj.login]}>` : `@${obj.login}`;
    message += `Hey ${mention}, this PR is waiting for your review: ${obj.url}\r\n`;
  }
  return message;
}

module.exports = {
  getPullRequestsWithRequestedReviewers,
  createPr2UserArray,
  stringToObject,
  prettyMessage
};

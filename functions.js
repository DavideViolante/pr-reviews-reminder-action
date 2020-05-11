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

function prettyMessage(pr2user) {
  let message = '';
  for (const obj of pr2user) {
    message += `Hey *${obj.login}*, this PR is waiting for your review: ${obj.url}\n`;
  }
  return message;
}

module.exports = {
  getPullRequestsWithRequestedReviewers,
  createPr2UserArray,
  prettyMessage
};

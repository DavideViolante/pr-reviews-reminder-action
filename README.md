# Pull Request reviews reminder action
[![](https://github.com/davideviolante/pr-reviews-reminder-action/workflows/Node.js%20CI/badge.svg)](https://github.com/DavideViolante/pr-reviews-reminder-action/actions?query=workflow%3A%22Node.js+CI%22) [![Maintainability](https://api.codeclimate.com/v1/badges/60f9b3a6b4177a0bfe77/maintainability)](https://codeclimate.com/github/DavideViolante/pr-reviews-reminder-action/maintainability) [![Donate](https://img.shields.io/badge/paypal-donate-179BD7.svg)](https://www.paypal.me/dviolante)

Action to send Slack notifications when there are pull requests pending for reviews.

## Inputs

### slack-webhook-url

The Slack webhook URL (required). More info [here](https://api.slack.com/messaging/webhooks).

### slack-channel

The Slack channel name (eg: `#general`).

### github-slack-map

A string like this `"githubusername1:slackuserid1,githubusername2:slackuserid2,..."` to define the mapping between GitHub usernames and Slack user IDs. Example: `"davideviolante:UEABCDEFG,foobar:UAABCDEFG"`. [How to find Slack User IDs](https://www.google.com/search?q=find+slack+user+id).

## Example usage

```yaml
name: PRs reviews reminder

on:
  schedule:
    # Every weekday every 2 hours during working hours, send notification
    - cron: "0 8-17/2 * * 1-5"

jobs:
  pr-reviews-reminder:
    runs-on: ubuntu-latest
    steps:
    - uses: davideviolante/pr-reviews-reminder-action@v1.1.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        slack-webhook-url: '' # Required
        slack-channel: '' # Eg: #general
        github-slack-map: '' # Eg: "davideviolante:UEABCDEFG,foobar:UAABCDEFG"
```

## Bug or feedback?
Please open an issue.

## Author
- [Davide Violante](https://github.com/DavideViolante)

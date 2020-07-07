# Pull Request reviews reminder action
[![](https://github.com/davideviolante/pr-reviews-reminder-action/workflows/Node.js%20CI/badge.svg)](https://github.com/DavideViolante/pr-reviews-reminder-action/actions?query=workflow%3A%22Node.js+CI%22) [![Maintainability](https://api.codeclimate.com/v1/badges/60f9b3a6b4177a0bfe77/maintainability)](https://codeclimate.com/github/DavideViolante/pr-reviews-reminder-action/maintainability) [![Donate](https://img.shields.io/badge/paypal-donate-179BD7.svg)](https://www.paypal.me/dviolante)

Action to send Slack/Teams notifications when there are pull requests pending for reviews.

## Inputs

### webhook-url

The webhook URL (required). More info [here (Slack)](https://api.slack.com/messaging/webhooks) and [here (Teams)](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using).

### channel

The channel name (eg: `#general`).

### github-provider-map

A string like this `"githubusername1:provideruserid1,githubusername2:provideruserid2,..."` to define the mapping between GitHub usernames and Slack/Teams user IDs. Example: `"DavideViolante:UEABCDEFG,foobar:UAABCDEFG"`. Note: it's case sensitive! [How to find Slack User IDs](https://www.google.com/search?q=find+slack+user+id).

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
        webhook-url: '' # Required
        channel: '' # Eg: #general
        github-provider-map: '' # Eg: "DavideViolante:UEABCDEFG,foobar:UAABCDEFG"
```

## Bug or feedback?
Please open an issue.

## Author
- [Davide Violante](https://github.com/DavideViolante)

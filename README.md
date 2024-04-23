# Pull Request reviews reminder action
[![](https://github.com/davideviolante/pr-reviews-reminder-action/workflows/Node.js%20CI/badge.svg)](https://github.com/DavideViolante/pr-reviews-reminder-action/actions?query=workflow%3A%22Node.js+CI%22) [![Coverage Status](https://coveralls.io/repos/github/DavideViolante/pr-reviews-reminder-action/badge.svg?branch=master)](https://coveralls.io/github/DavideViolante/pr-reviews-reminder-action?branch=master) [![Maintainability](https://api.codeclimate.com/v1/badges/60f9b3a6b4177a0bfe77/maintainability)](https://codeclimate.com/github/DavideViolante/pr-reviews-reminder-action/maintainability) [![Donate](https://img.shields.io/badge/paypal-donate-179BD7.svg)](https://www.paypal.me/dviolante)

Action to send Slack/Rocket/Teams notifications when there are pull requests pending for reviews.

## Preview
![Preview](https://raw.githubusercontent.com/DavideViolante/pr-reviews-reminder-action/master/preview.png "Preview")

## Inputs

### webhook-url

The webhook URL (required). More info [here (Slack)](https://api.slack.com/messaging/webhooks) and [here (Teams)](https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/connectors-using#setting-up-a-custom-incoming-webhook).

### provider

Chat provider, `slack`, `rocket` or `msteams` (required). Default `slack`.

### channel

The channel name, eg: `#general` (optional).

### github-provider-map

A string like this `"githubusername1:provideruserid1,githubusername2:provideruserid2,..."` to define the mapping between GitHub usernames and Slack/MS Teams user IDs (optional). Example: `"DavideViolante:UEABCDEFG,foobar:UAABCDEFG"`. Note: it's case sensitive! [How to find Slack User IDs](https://www.google.com/search?q=find+slack+user+id).

For MS Teams, the provider user ID can be an [MS teams user ID or a UPN](https://www.google.com/search?q=find+%22microsoft+teams%22+userprincipalname+-office) Example: `"DavideViolante:admin@DavideViolante.onmicrosoft.com',foobar:foobar@foobar.onmicrosoft.com"`.

Another hacky way (no code) to find the MS Teams UPN is the following: open MS Teams on your browser, click the 3 dots near your Team name, click Add member, open Google Chrome console Network tab Fetch/XHR category, type the email address, look for "searchV2" in the Network tab, click Response tab.

### ignore-label

Ignore Pull Requests with that label(s), eg: `no-reminder` or `no-reminder,ignore me` (optional).

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
    - uses: davideviolante/pr-reviews-reminder-action@v2.8.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        webhook-url: '' # Required
        provider: '' # Required (slack, rocket or msteams)
        channel: '' # Optional, eg: #general
        github-provider-map: '' # Optional, eg: DavideViolante:UEABCDEFG,foobar:UAABCDEFG
        ignore-label: '' # Optional, eg: no-reminder,ignore me
```

## Bug or feedback?
Please open an issue.

## Author
- [Davide Violante](https://github.com/DavideViolante)

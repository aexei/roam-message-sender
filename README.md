# Roam Message Sender GitHub Action

A GitHub Action that sends chat messages to Roam (https://ro.am) directly from your GitHub workflows.

[![GitHub release](https://img.shields.io/github/release/yourusername/roam-message-sender.svg)](https://github.com/yourusername/roam-message-sender/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 💬 Send messages to Roam users or groups
- 👤 Customize sender information
- 🚀 Easy integration with GitHub workflows
- 🔔 Perfect for notifications and alerts

## Usage

Add this action to your GitHub workflow:

```yaml
name: Send Notification to Roam

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Send message to Roam
        uses: yourusername/roam-message-sender@v1
        with:
          roam-api-key: ${{ secrets.ROAM_API_KEY }}
          recipients: 'user123,group456'
          message: '🚀 New commit pushed to the repository!'
```

## Setup

1. Obtain a Roam API key from your Roam workspace settings
2. Add the API key as a secret in your GitHub repository:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `ROAM_API_KEY`
   - Value: Your Roam API key
3. Use the secret in your workflow as shown in the example above

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `roam-api-key` | Roam API key for authentication | Yes | - |
| `recipients` | Comma-separated list of Roam recipient IDs | Yes | - |
| `message` | The message content to send to Roam | Yes | - |
| `sender-id` | Custom ID for the message sender | No | - |
| `sender-name` | Custom name for the message sender | No | - |
| `sender-image` | Custom image URL for the message sender | No | - |

## Outputs

| Output | Description |
|--------|-------------|
| `message-id` | The ID of the sent message (if returned by the API) |

## Example: Advanced Usage

This example shows how to send a message with a custom sender:

```yaml
name: Deploy Notification

on:
  workflow_dispatch:
  deployment:
    types: [deployed]

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Send deployment notification
        uses: yourusername/roam-message-sender@v1
        with:
          roam-api-key: ${{ secrets.ROAM_API_KEY }}
          recipients: ${{ secrets.ROAM_DEVOPS_GROUP }}
          message: "🚀 Deployment to ${{ github.event.deployment.environment }} completed successfully!"
          sender-name: "GitHub Deployment Bot"
          sender-image: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
```

## Example: Sending Notifications on Failed Tests

```yaml
name: Test and Notify

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run tests
        id: tests
        run: npm test
        continue-on-error: true
      
      - name: Notify on test failure
        if: steps.tests.outcome == 'failure'
        uses: yourusername/roam-message-sender@v1
        with:
          roam-api-key: ${{ secrets.ROAM_API_KEY }}
          recipients: ${{ secrets.DEVELOPER_GROUP_ID }}
          message: "❌ Tests failed in ${{ github.repository }} on branch ${{ github.ref_name }}!"
          sender-name: "GitHub CI"
```

## Authentication

This action requires a Roam API key to authenticate with the Roam API. You can obtain an API key from your Roam workspace settings.

**Important:** Always store your API key as a secret in your GitHub repository. Never hardcode it in your workflow files.

## Technical Details

This action makes a POST request to the `https://api.ro.am/v1/chat.sendMessage` endpoint with the following payload structure:

```json
{
  "recipients": ["user1", "user2", ...],
  "text": "Your message content",
  "sender": {
    "id": "custom-id",
    "name": "Custom Name",
    "imageUrl": "https://example.com/image.png"
  }
}
```

The `sender` object is optional and will only be included if any sender properties are provided.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

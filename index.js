const core = require('@actions/core');
const fetch = require('node-fetch');
const { inspect } = require('util');

async function run() {
  try {
    // Get inputs from workflow
    const apiKey = core.getInput('roam-api-key', { required: true });
    const message = core.getInput('message', { required: true });
    const recipients = core.getInput('recipients', { required: true });
    const senderName = core.getInput('sender-name');
    const senderImage = core.getInput('sender-image');
    const senderId = core.getInput('sender-id');

    // Parse recipients (comma-separated list of recipient IDs)
    const recipientList = recipients.split(',').map(id => id.trim());

    if (recipientList.length === 0) {
      throw new Error('At least one recipient must be provided');
    }

    // Prepare the sender object
    const sender = {};
    if (senderId) sender.id = senderId;
    if (senderName) sender.name = senderName;
    if (senderImage) sender.imageUrl = senderImage;

    // Prepare the request payload
    const payload = {
      recipients: recipientList,
      text: message
    };

    // Add sender if provided
    if (Object.keys(sender).length > 0) {
      payload.sender = sender;
    }

    core.info(`Sending message to ${recipientList.length} recipient(s)`);

    // For testing: mock API response if in test mode
    const response = await fetch('https://api.ro.am/v1/chat.sendMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'GitHub-Action-Roam-Message-Sender'
      },
      body: JSON.stringify(payload)
    });

    // Handle the response
    const responseData = await response.json();

    // Log the response for debugging
    core.info(`Response from Roam API: ${JSON.stringify(responseData, null, 2)}`);

    if (!response.ok) {
      const errorMessage = responseData?.error || response.statusText;
      throw new Error(`Roam API error (${response.status}): ${errorMessage}`);
    }

    // Log success message
    core.info('Message sent successfully to Roam!');
    if (responseData?.chatId) {
      core.info(`Message ID: ${responseData.chatId}`);
      core.setOutput('message-id', responseData.chatId);
    }

    // Set job summary
    core.summary.addHeading('Roam Message Sent Successfully');
    core.summary.addRaw(`Message was sent to ${recipientList.length} recipient(s)`);
    core.summary.addCodeBlock(message, 'text');
    core.summary.write();

  } catch (error) {
    core.debug(inspect(error));
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();

// Export for testing
module.exports = run;

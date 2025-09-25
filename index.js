const core = require('@actions/core');
const fetch = require('node-fetch');
const { inspect } = require('util');

async function sendMessage(recipients, message, apiKey, sender) {

  if (recipients.length > 1) {
    throw new Error('Only one recipient is allowed for sendMessage endpoint');
  }

  // Prepare the request payload
  const payload = {
    recipients: recipients,
    text: message,
  };

  // Add sender if provided
  if (Object.keys(sender).length > 0) {
    payload.sender = sender;
  }

  core.info(`Sending message to ${recipients.length} recipient(s)`);

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

  if (!response.ok) {
    const errorMessage = responseData?.error || response.statusText;
    throw new Error(`Roam API error (${response.status}): ${errorMessage}`);
  }

  // Handle the response
  const responseData = await response.json();

  return responseData;
}

async function sendToChat(chats, message, apiKey) {
  // Prepare the request payload
  const payload = {
    chat: chats,
    text: message,
    sync: true
  };

  core.info(`Sending message to ${chats.length} chat(s)`);

  // For testing: mock API response if in test mode
  const response = await fetch('https://api.ro.am/v0/chat.post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload)
  });

  // Handle the response
  const responseData = await response.json();

  return responseData;
}

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
    const regex = /^[BUVGMDPC]-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const sendMessageRecipientList = recipientList.filter(id => !regex.test(id));
    const sendChatRecipientList = recipientList.filter(id => regex.test(id));

    if (sendMessageRecipientList.length > 0) {
      const sender = {};
      if (senderId) sender.id = senderId;
      if (senderName) sender.name = senderName;
      if (senderImage) sender.imageUrl = senderImage;

      const responseData = await sendMessage(sendMessageRecipientList, message, apiKey, sender);

      core.summary.addRaw(responseData);

      // Log the response for debugging
      core.info(`Response from Roam API Message: ${JSON.stringify(responseData, null, 2)}`);

      // Log success message
      core.info('Message sent successfully to Roam!');
      if (responseData?.chatId) {
        core.info(`Message ID: ${responseData.chatId}`);
        core.setOutput('message-id', responseData.chatId);
      }
    }

    if (sendChatRecipientList.length > 0) {
      const responseData = await sendToChat(sendChatRecipientList, message, apiKey);

      core.info(`Response from Roam API Chat: ${JSON.stringify(responseData, null, 2)}`);
    }

  } catch (error) {
    core.debug(inspect(error));
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();

// Export for testing
module.exports = run;

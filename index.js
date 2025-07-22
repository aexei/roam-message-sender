const core = require('@actions/core');
const fetch = require('node-fetch');
const { version } = require('./package.json');

async function run() {

  console.log('Starting Roam Message Sender Action...');
  console.log(`Action Version: ${version}`);

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

    console.log(`Sending message to ${recipientList.length} recipient(s)`);

    // For testing: mock API response if in test mode
    let response;
    if (process.env.MOCK_ROAM_API === 'true') {
      console.log('Running in mock mode - no actual API call will be made');
      console.log('Payload that would be sent:', JSON.stringify(payload, null, 2));

      // Create a mock successful response
      response = {
        ok: true,
        status: 200,
        json: async () => ({
          chatId: 'mock-message-id-123',
          status: 'sent'
        }),
        text: async () => JSON.stringify({
          chatId: 'mock-message-id-123',
          status: 'sent'
        })
      };
    } else {
      // Send the actual request to Roam API
      response = await fetch('https://api.ro.am/v1/chat.sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'User-Agent': 'GitHub-Action-Roam-Message-Sender'
        },
        body: JSON.stringify(payload)
      });
    }

    // Handle the response
    const responseData = await response.json();
    console.log(`Response from Roam API: ${JSON.stringify(responseData, null, 2)}`);
    core.debug(`Response from Roam API: ${JSON.stringify(responseData, null, 2)}`);

    if (!response.ok) {
      const errorMessage = responseData?.error || response.statusText;
      throw new Error(`Roam API error (${response.status}): ${errorMessage}`);
    }

    // Log success message
    console.log('Message sent successfully to Roam!');
    if (responseData?.chatId) {
      console.log(`Message ID: ${responseData.chatId}`);
      core.setOutput('message-id', responseData.chatId);
    }

    // Set job summary
    core.summary.addHeading('Roam Message Sent Successfully');
    core.summary.addRaw(`Message was sent to ${recipientList.length} recipient(s)`);
    core.summary.addCodeBlock(message, 'text');
    core.summary.write();

  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();

// Export for testing
module.exports = run;

const core = require('@actions/core');
const fetch = require('node-fetch');

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
    
    console.log(`Sending message to ${recipientList.length} recipient(s)`);
    
    // Send the request to Roam API
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
    const responseText = await response.text();
    let responseData;
    
    try {
      if (responseText) {
        responseData = JSON.parse(responseText);
      }
    } catch (error) {
      console.log('Failed to parse response as JSON:', responseText);
    }
    
    if (!response.ok) {
      const errorMessage = responseData?.error || responseText || response.statusText;
      throw new Error(`Roam API error (${response.status}): ${errorMessage}`);
    }
    
    // Log success message
    console.log('Message sent successfully to Roam!');
    if (responseData?.id) {
      console.log(`Message ID: ${responseData.id}`);
      core.setOutput('message-id', responseData.id);
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
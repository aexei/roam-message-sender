const nock = require('nock');
const path = require('path');
const { execSync } = require('child_process');

// Mock the GitHub Actions core module
jest.mock('@actions/core');
const core = require('@actions/core');

// Setup input mocks
const mockInputs = {
  'roam-api-key': 'test-api-key',
  'message': 'Hello from GitHub Actions!',
  'recipients': 'user123,group456',
  'sender-id': '',
  'sender-name': '',
  'sender-image': ''
};

// Mock the getInput function
core.getInput = jest.fn().mockImplementation((name, options) => {
  const value = mockInputs[name];
  if (options && options.required && !value) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  return value;
});

// Mock the setOutput function
core.setOutput = jest.fn();

// Mock the setFailed function
core.setFailed = jest.fn();

// Mock the summary object
core.summary = {
  addHeading: jest.fn().mockReturnThis(),
  addRaw: jest.fn().mockReturnThis(),
  addCodeBlock: jest.fn().mockReturnThis(),
  write: jest.fn().mockResolvedValue()
};

describe('Roam Message Sender', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset nock
    nock.cleanAll();
  });
  
  it('should send a message to Roam recipients', async () => {
    // Mock the Roam API response
    nock('https://api.ro.am')
      .post('/v1/chat.sendMessage', body => {
        expect(body).toEqual({
          recipients: ['user123', 'group456'],
          text: 'Hello from GitHub Actions!'
        });
        return true;
      })
      .reply(200, {
        id: 'msg_123456',
        status: 'sent'
      });
    
    // Run the action
    const indexPath = path.join(__dirname, '../index.js');
    const result = execSync(`node ${indexPath}`, { encoding: 'utf8' });
    
    // Check that the action logged the success message
    expect(result).toContain('Message sent successfully to Roam!');
    
    // Check that outputs were set correctly
    expect(core.setOutput).toHaveBeenCalledWith('message-id', 'msg_123456');
    
    // Check that setFailed was not called
    expect(core.setFailed).not.toHaveBeenCalled();
  });
  
  it('should include sender information when provided', async () => {
    // Update mock inputs to include sender info
    mockInputs['sender-name'] = 'GitHub Bot';
    mockInputs['sender-image'] = 'https://example.com/bot.png';
    
    // Mock the Roam API response
    nock('https://api.ro.am')
      .post('/v1/chat.sendMessage', body => {
        expect(body).toEqual({
          recipients: ['user123', 'group456'],
          text: 'Hello from GitHub Actions!',
          sender: {
            name: 'GitHub Bot',
            imageUrl: 'https://example.com/bot.png'
          }
        });
        return true;
      })
      .reply(200, {
        id: 'msg_789012',
        status: 'sent'
      });
    
    // Run the action
    const indexPath = path.join(__dirname, '../index.js');
    const result = execSync(`node ${indexPath}`, { encoding: 'utf8' });
    
    // Check that the action logged the success message
    expect(result).toContain('Message sent successfully to Roam!');
    
    // Reset mock inputs
    mockInputs['sender-name'] = '';
    mockInputs['sender-image'] = '';
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock an API error response
    nock('https://api.ro.am')
      .post('/v1/chat.sendMessage')
      .reply(401, {
        error: 'invalid_token',
        message: 'The provided API key is invalid'
      });
    
    // Run the action and expect it to fail
    const indexPath = path.join(__dirname, '../index.js');
    try {
      execSync(`node ${indexPath}`, { encoding: 'utf8' });
    } catch (error) {
      // Check that setFailed was called with the error message
      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('Roam API error (401)')
      );
    }
  });
  
  it('should validate that at least one recipient is provided', async () => {
    // Update mock inputs to have empty recipients
    const originalRecipients = mockInputs['recipients'];
    mockInputs['recipients'] = '';
    
    // Run the action and expect it to fail
    const indexPath = path.join(__dirname, '../index.js');
    try {
      execSync(`node ${indexPath}`, { encoding: 'utf8' });
    } catch (error) {
      // Check that setFailed was called with the error message
      expect(core.setFailed).toHaveBeenCalledWith(
        expect.stringContaining('At least one recipient must be provided')
      );
    }
    
    // Reset mock inputs
    mockInputs['recipients'] = originalRecipients;
  });
});
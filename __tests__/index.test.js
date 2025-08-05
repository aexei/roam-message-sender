const nock = require('nock');

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
core.getInput = jest.fn().mockImplementation((name, options = {}) => {
  if (options.required && !mockInputs[name]) {
    throw new Error(`Input required and not supplied: ${name}`);
  }
  return mockInputs[name] || '';
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
  let originalConsoleLog;
  let originalConsoleError;
  
  beforeEach(() => {
    // Save original console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    
    // Mock console methods to capture output
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset nock
    nock.cleanAll();
    
    // Set up environment for tests
    process.env.GITHUB_WORKFLOW = 'test-workflow';
    process.env.GITHUB_ACTION = 'roam-message-sender';
    process.env.GITHUB_ACTOR = 'test-user';
    process.env.GITHUB_REPOSITORY = 'test-user/test-repo';
    process.env.GITHUB_EVENT_NAME = 'push';
    process.env.GITHUB_SHA = '1234567890abcdef1234567890abcdef12345678';
    process.env.GITHUB_REF = 'refs/heads/main';
    process.env.MOCK_ROAM_API = 'true'; // Always use mock in tests
  });
  
  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
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
        chatId: 'msg_123456',
        status: 'sent'
      });
    
    // Run the action by requiring it directly
    // This is a better approach than using execSync
    await require('../index.js');
    
    // Check that outputs were set correctly
    expect(core.setOutput).toHaveBeenCalledWith('message-id', expect.any(String));
    
    // Check that setFailed was not called
    expect(core.setFailed).not.toHaveBeenCalled();
  });
  
});
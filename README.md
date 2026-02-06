# WorkIQ MCP Client

A Node.js application with both CLI and Web UI that connects to the WorkIQ MCP server to query Microsoft 365 workplace intelligence.

## What is WorkIQ?

WorkIQ is an MCP (Model Context Protocol) server that provides access to Microsoft 365 Copilot data, including:
- **Emails** - Search and query email content
- **Meetings** - Find calendar events and meetings  
- **Documents** - Search SharePoint, OneDrive files
- **Teams Messages** - Query Teams conversations
- **People Information** - Get info about colleagues and their work

## Prerequisites

- Node.js 18+
- Microsoft 365 account with Copilot access
- WorkIQ MCP server (`@microsoft/workiq`)

## Installation

```bash
npm install
```

## Usage

### Web UI (Recommended)

```bash
npm run web
```

Then open your browser to http://localhost:3000

The web interface provides:
- Modern, intuitive UI for querying WorkIQ
- Quick example queries to get started
- Real-time connection status
- Easy-to-read response formatting

### CLI

```bash
npm start
```

The CLI app will:
1. Connect to the WorkIQ MCP server via stdio
2. List available tools
3. Allow you to query M365 data interactively

## Example Queries

- "emails from John about project X"
- "meetings this week"
- "documents about Q4 planning"
- "what is Sarah working on?"
- "what was discussed in yesterday's standup?"

## How It Works

This app uses the MCP SDK to spawn and connect to the WorkIQ server:

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'npx',
  args: ['-y', '@microsoft/workiq', 'mcp']
});

const client = new Client({ name: 'my-client', version: '1.0.0' });
await client.connect(transport);

// Call the WorkIQ tool
const result = await client.callTool({
  name: 'ask_work_iq',
  arguments: { question: 'What are my upcoming meetings?' }
});
```

## Project Structure

```
vibe-workiq/
├── index.js        # CLI client application
├── server.js       # Web server with API endpoints
├── public/         # Frontend web UI
│   ├── index.html  # Main HTML page
│   ├── styles.css  # UI styling
│   └── app.js      # Client-side JavaScript
├── package.json    # Project configuration
└── README.md       # This file
```

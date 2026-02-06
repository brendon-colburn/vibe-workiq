import express from 'express';
import cors from 'cors';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MCP client instance
let mcpClient = null;
let availableTools = [];
let isConnected = false;

// Initialize MCP connection
async function initializeMCPClient() {
  if (isConnected) {
    return;
  }

  try {
    console.log('🔌 Connecting to WorkIQ MCP Server...');
    
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@microsoft/workiq', 'mcp']
    });

    mcpClient = new Client({
      name: 'vibe-workiq-web-client',
      version: '1.0.0'
    });

    await mcpClient.connect(transport);
    
    // Get available tools
    const toolsResponse = await mcpClient.listTools();
    availableTools = toolsResponse.tools || [];
    
    isConnected = true;
    console.log('✅ Connected to WorkIQ MCP Server');
    console.log(`   Available tools: ${availableTools.map(t => t.name).join(', ')}`);
  } catch (error) {
    console.error('❌ Failed to connect to WorkIQ MCP Server:', error.message);
    throw error;
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connected: isConnected,
    tools: availableTools.length
  });
});

// Get available tools
app.get('/api/tools', async (req, res) => {
  try {
    if (!isConnected) {
      await initializeMCPClient();
    }
    res.json({ tools: availableTools });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Query WorkIQ
app.post('/api/query', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    if (!isConnected) {
      await initializeMCPClient();
    }

    console.log(`📡 Processing query: "${question}"`);
    
    const result = await mcpClient.callTool({
      name: 'ask_work_iq',
      arguments: { question }
    });

    // Extract text content from response
    let responseText = '';
    if (result.content) {
      for (const item of result.content) {
        if (item.type === 'text') {
          responseText += item.text;
        }
      }
    }

    res.json({ 
      success: true,
      response: responseText || JSON.stringify(result, null, 2)
    });
  } catch (error) {
    console.error('❌ Error processing query:', error.message);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║       WorkIQ Web UI Server               ║');
  console.log('║   Query Microsoft 365 Copilot Data       ║');
  console.log('╚══════════════════════════════════════════╝\n');
  console.log(`🌐 Server running at http://localhost:${PORT}`);
  console.log(`📂 Serving static files from: ${path.join(__dirname, 'public')}\n`);
  
  // Try to initialize MCP client on startup
  try {
    await initializeMCPClient();
  } catch (error) {
    console.log('⚠️  MCP client will be initialized on first query\n');
  }
});

// Handle shutdown
process.on('SIGINT', async () => {
  console.log('\n\n👋 Shutting down server...');
  if (mcpClient && isConnected) {
    await mcpClient.close();
  }
  process.exit(0);
});

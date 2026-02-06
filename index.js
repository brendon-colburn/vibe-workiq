import readline from 'readline';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// WorkIQ MCP Client App
// Connects to the WorkIQ MCP server to query Microsoft 365 data

let mcpClient = null;
let availableTools = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function displayBanner() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║          WorkIQ MCP Client               ║');
  console.log('║   Query Microsoft 365 Copilot Data       ║');
  console.log('╚══════════════════════════════════════════╝\n');
}

async function connectToWorkIQ() {
  console.log('🔌 Connecting to WorkIQ MCP Server...');
  
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@microsoft/workiq', 'mcp']
  });

  mcpClient = new Client({
    name: 'vibe-workiq-client',
    version: '1.0.0'
  });

  await mcpClient.connect(transport);
  
  // Get available tools
  const toolsResponse = await mcpClient.listTools();
  availableTools = toolsResponse.tools || [];
  
  console.log('✅ Connected to WorkIQ MCP Server');
  console.log(`   Available tools: ${availableTools.map(t => t.name).join(', ')}\n`);
}

async function displayMenu() {
  console.log('Available queries you can make:');
  console.log('  1. Search emails (e.g., "emails from John about project X")');
  console.log('  2. Find meetings (e.g., "meetings next week")');
  console.log('  3. Search documents (e.g., "documents about budget")');
  console.log('  4. People info (e.g., "what is Sarah working on")');
  console.log('  5. General workplace question');
  console.log('  t. List available tools');
  console.log('  q. Quit\n');
}

async function callWorkIQ(question) {
  console.log('\n📡 Sending query to WorkIQ MCP Server...');
  console.log(`   Query: "${question}"`);
  console.log('\n─────────────────────────────────────────');
  
  try {
    // Call the ask_work_iq tool
    const result = await mcpClient.callTool({
      name: 'ask_work_iq',
      arguments: { question }
    });
    
    console.log('\n📬 Response from WorkIQ:\n');
    
    if (result.content) {
      for (const item of result.content) {
        if (item.type === 'text') {
          console.log(item.text);
        } else {
          console.log(JSON.stringify(item, null, 2));
        }
      }
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('\n❌ Error calling WorkIQ:', error.message);
    if (error.message.includes('EULA') || error.message.includes('eula')) {
      console.log('\n💡 You may need to accept the EULA first.');
      console.log('   Try running: npx -y @microsoft/workiq mcp');
    }
  }
  
  console.log('\n─────────────────────────────────────────\n');
}

async function listTools() {
  console.log('\n🔧 Available MCP Tools:\n');
  for (const tool of availableTools) {
    console.log(`  • ${tool.name}`);
    if (tool.description) {
      console.log(`    ${tool.description}\n`);
    }
  }
  console.log('');
}

async function main() {
  await displayBanner();
  
  try {
    await connectToWorkIQ();
  } catch (error) {
    console.error('❌ Failed to connect to WorkIQ MCP Server:', error.message);
    console.log('\nMake sure you have the WorkIQ package available:');
    console.log('  npx -y @microsoft/workiq mcp\n');
    rl.close();
    process.exit(1);
  }
  
  let running = true;
  
  while (running) {
    await displayMenu();
    const choice = await askQuestion('Enter choice (1-5, t, or q): ');
    
    switch (choice.toLowerCase()) {
      case '1':
        const emailQuery = await askQuestion('Enter email search query: ');
        await callWorkIQ(emailQuery || 'recent emails about project updates');
        break;
      case '2':
        const meetingQuery = await askQuestion('Enter meeting search query: ');
        await callWorkIQ(meetingQuery || 'meetings this week');
        break;
      case '3':
        const docQuery = await askQuestion('Enter document search query: ');
        await callWorkIQ(docQuery || 'documents shared with me');
        break;
      case '4':
        const personQuery = await askQuestion('Enter person/team query: ');
        await callWorkIQ(personQuery || 'what is the team working on');
        break;
      case '5':
        const generalQuery = await askQuestion('Enter your workplace question: ');
        await callWorkIQ(generalQuery || 'what are my priorities today');
        break;
      case 't':
        await listTools();
        break;
      case 'q':
      case 'quit':
      case 'exit':
        running = false;
        console.log('\n👋 Disconnecting from WorkIQ...');
        if (mcpClient) {
          await mcpClient.close();
        }
        console.log('Goodbye!\n');
        break;
      default:
        console.log('\n⚠️  Invalid choice. Please try again.\n');
    }
  }
  
  rl.close();
}

main().catch(console.error);

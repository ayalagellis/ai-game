import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';


async function main() {

const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:3000/mcp')
);

const client = new Client({
    name: 'example-client',
    version: '1.0.0'
});

await client.connect(transport);

console.log('✓ Connected to MCP server');

// Call the 'add' tool
const result = await client.callTool({
    name: 'add',
    arguments: {
        a: 5,
        b: 3
    }
});

//console.log('Result:', result);

// Close the connection
await client.close();
console.log('✓ Connection closed');
}

main().catch((err) => {
    console.error("Cliet error: ", err);
});
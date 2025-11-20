import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";

// Load environment variables from server directory
// This must be imported FIRST before any other modules that use process.env

// Try multiple locations to ensure we find the .env file
// We check these in order of likelihood based on how the server is run
const envPaths = [
  path.resolve(process.cwd(), '.env'),           // Current working directory (if running from server/)
  path.resolve(process.cwd(), 'server', '.env'),  // If running from project root
];

// Try each path until we find a .env file with OPENAI_API_KEY
let envLoaded = false;
for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (!result.error && process.env['GOOGLE_API_KEY']) {
      console.log(`✓ Loaded environment variables from: ${envPath}`);
      envLoaded = true;
      break;
    }
  }
}

// Fallback: try default dotenv.config() which looks in current directory
if (!envLoaded && !process.env['GOOGLE_API_KEY']) {
  dotenv.config();
  if (process.env['GOOGLE_API_KEY']) {
    console.log('✓ Loaded environment variables from default location');
  } else {
    console.error('✗ WARNING: GOOGLE_API_KEY not found in environment variables!');
    console.error('Please ensure you have a .env file in the server directory with GOOGLE_API_KEY set.');
    process.exit(1);
  }
}

export {};


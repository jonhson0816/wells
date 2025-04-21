// Save this as find-localhost.js and run with Node.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const rootDir = path.join(__dirname, 'src'); // Change this to your project root
const searchTerms = ['localhost:5000', 'localhost', '127.0.0.1:5000', '127.0.0.1'];
const excludeDirs = ['node_modules', 'build', 'dist', '.git'];
const fileExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.env', '.env.local', '.env.development'];

// Function to search files
function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory() && !excludeDirs.includes(file)) {
      searchFiles(filePath);
    } else if (stats.isFile() && fileExtensions.includes(path.extname(file))) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        searchTerms.forEach(term => {
          if (content.includes(term)) {
            console.log(`Found "${term}" in ${filePath}`);
            
            // Get the lines containing the term for context
            const lines = content.split('\n');
            lines.forEach((line, index) => {
              if (line.includes(term)) {
                console.log(`  Line ${index + 1}: ${line.trim()}`);
              }
            });
            console.log();
          }
        });
      } catch (err) {
        console.error(`Error reading file ${filePath}: ${err.message}`);
      }
    }
  });
}

// Start the search
console.log('Searching for localhost references...');
searchFiles(rootDir);
console.log('Search complete!');
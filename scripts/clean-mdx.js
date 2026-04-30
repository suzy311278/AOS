const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
    path.join(__dirname, '../src/content/esg-investing/lessons'),
    path.join(__dirname, '../src/content/eu-sfdr/lessons')
];

function processDirectory(directory) {
    if (!fs.existsSync(directory)) {
        console.log(`Directory not found: ${directory}`);
        return;
    }

    const files = fs.readdirSync(directory);

    files.forEach(file => {
        if (file.endsWith('.mdx')) {
            const filePath = path.join(directory, file);
            processFile(filePath);
        }
    });
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // 1. Remove isolated section breakers '---'
    // Only remove lines that are exactly '---' or '--- ' with optional leading/trailing spaces, 
    // but *not* frontmatter if it exists at the very top (though these files don't seem to use YAML frontmatter).
    // Actually, let's just use a regex for a line that is solely '---' preserving the surrounding structure.
    // Look out for actual YAML frontmatter: if the file starts with '---', don't remove the first two '---'.
    // However, looking at 0.1.mdx, they use '---' as visual horizontal rules.
    content = content.replace(/^---\s*$/gm, '');

    // 2. Replace em-dashes and en-dashes.
    // Common sentence structures: "...something — something else..."
    // We will replace " — " with ", " 
    // and " – " (en-dash surrounded by spaces) with ", "
    // For tightly packed ones like "word—word", we'll replace with "word, word" or "word (word)".
    // Given user rules: "Use commas, colons, or parentheses instead"
    content = content.replace(/ — /g, ', ');
    content = content.replace(/ – /g, ', ');

    // Replace remaining isolated em-dashes / en-dashes
    // (e.g., at the end of a line or tight strings)
    content = content.replace(/—/g, ', ');
    content = content.replace(/–/g, '-'); // Actually en-dash in ranges like "1994–1996" or "Sections 1–2". We should replace en-dash in ranges with a hyphen.

    // Clean up any weird comma artifacts like ", ," or ", ."
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/,\s*\./g, '.');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`Processed: ${path.basename(filePath)}`);
    }
}

DIRECTORIES.forEach(processDirectory);

console.log('Dash and section-breaker cleanup complete.');

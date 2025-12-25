const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Simple in-memory cache
const cache = {};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readData = (collection) => {
    // Return cached data if available
    if (cache[collection]) {
        return cache[collection];
    }

    try {
        const filePath = getFilePath(collection);
        if (!fs.existsSync(filePath)) {
            // Initialize empty file and cache
            fs.writeFileSync(filePath, '[]'); 
            cache[collection] = [];
            return [];
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        
        // Update cache
        cache[collection] = parsed;
        return parsed;
    } catch (error) {
        console.error(`Error reading ${collection}:`, error);
        return [];
    }
};

const writeData = (collection, data) => {
    try {
        // Update cache immediately
        cache[collection] = data;

        // Persist to disk
        const filePath = getFilePath(collection);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${collection}:`, error);
        return false;
    }
};

module.exports = { readData, writeData };

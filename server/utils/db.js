const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readData = (collection) => {
    try {
        const filePath = getFilePath(collection);
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, '[]'); 
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${collection}:`, error);
        return [];
    }
};

const writeData = (collection, data) => {
    try {
        const filePath = getFilePath(collection);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${collection}:`, error);
        return false;
    }
};

module.exports = { readData, writeData };

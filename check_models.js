const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.split('\n').find(line => line.startsWith('GEMINI_API_KEY=')).split('=')[1].trim();

async function run() {
    const list = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`).then(res => res.json());
    if (list.models) {
        console.log("AVAILABLE MODELS:", list.models.map(m => m.name).join('\n'));
    } else {
        console.log("ERROR LISTING:", list);
    }
}
run();

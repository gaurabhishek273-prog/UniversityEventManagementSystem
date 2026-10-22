require('dotenv').config();

console.log(
    process.env.OPENAI_API_KEY
        ? 'OpenAI API key loaded successfully!'
        : 'OpenAI API key NOT found!'
);
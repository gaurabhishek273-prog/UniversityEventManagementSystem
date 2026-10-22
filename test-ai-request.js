require('dotenv').config();

const OpenAI = require('openai');

const client = new OpenAI();

async function testAI() {
    try {
        const response = await client.responses.create({
            model: 'gpt-5.6-luna',
            input: 'Explain what a university event management system is in one sentence.'
        });

        console.log('AI response:');
        console.log(response.output_text);
    } catch (error) {
        console.error('AI request failed:');
        console.error(error.message);
    }
}

testAI();
require('dotenv').config();

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function testGemini() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: 'Explain a university event management system in one sentence.'
        });

        console.log('Gemini connected successfully!');
        console.log(response.text);
    } catch (error) {
        console.error('Gemini request failed:');
        console.error(error.message);
    }
}

testGemini();
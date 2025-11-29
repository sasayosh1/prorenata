const { OpenAI } = require("openai");
require("dotenv").config({ path: ".env.local" });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function testKey() {
    try {
        console.log("Testing OpenAI API Key...");
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Hello" }],
            model: "gpt-3.5-turbo",
            max_tokens: 5,
        });
        console.log("Success! Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("Error:", error.message);
        if (error.code) console.error("Code:", error.code);
    }
}

testKey();

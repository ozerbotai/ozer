const OpenAI=require("openai")
require('dotenv').config({ path: '.env.local' })

const openai = new OpenAI({
    organization: process.env.OPENAI_ORG,
    apiKey: process.env.OPENAI_KEY
  });

exports.sendPromptToGPT = async function (prompt) {
    const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        stream: true,
    });
    let response;
    response = ''
    for await (const chunk of stream) {
        response += chunk.choices[0]?.delta?.content || ""        
    }
    return(response)
}

exports.sendPromptToGPTWithFiles = async function (prompt, files) {
    // Prepare the form data
    const formData = new FormData();
    formData.append("prompt", prompt);

    // Append each file to the form data
    files.forEach((file, index) => {
        formData.append(`file${index}`, file);
    });

    try {
        const response = await fetch("https://api.openai.com/v1/engines/gpt-4o/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error calling GPT-4 API:", error);
        throw error;
    }
}
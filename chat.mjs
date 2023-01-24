import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";

dotenv.config();

const configuration = new Configuration({
    apiKey: process.env.OPEN_API_KEY,
});

const openai = new OpenAIApi(configuration);
const max_tokens = 2048;

const openAICompletion = async (_prompt) => {
    try {
        const completion = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: _prompt.toString(),
            temperature: 0.6,
            n: 1,
            stream: true,
            max_tokens: max_tokens
        }, { responseType: 'stream' });

        return completion;
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
};

process.stdout.write(">> ");
let stdin = process.openStdin();
stdin.addListener("data", (d) => {
    if (d.toString() === "quit\n") {
        process.stdout.write("Goodbye!");
        process.exit(0);
        return;
    }
    const resp = openAICompletion(d).then((resp) => {
        resp.data.on(
            "data",
            data => {
                const lines = data.toString().split('\n').filter(line => line.trim() !== '');
                for (const line of lines) {
                    const message = line.replace(/^data: /, '');
                    if (message === '[DONE]') {
                        console.log("\nTHE END\n");
                        process.stdout.write(">> ");
                        return; // Stream finished
                    }
                    if (message === '.' || message.charAt(message.length - 1) === '.') {
                        process.stdout.write("\n");
                    }
                    try {
                        const parsed = JSON.parse(message);
                        process.stdout.write(parsed.choices[0].text);
                    } catch (error) {
                        console.error('Could not JSON parse stream message', message, error);
                    }
                }
            }
        );
    });
});
import OpenAI from "openai";

class OpenAiClientWrapper {
    private readonly _client: OpenAI;
    private readonly _model = "gpt-4o-mini"

    constructor() {
        const apiKey = process.env.openAiSecret;
        if (!apiKey) throw new Error(`'${apiKey}' is not a valid openAI api key.`);
        this._client = new OpenAI({
            apiKey,
            organization: "org-YPdYFysKphKiuoolooRN1i0v",
            defaultHeaders: {
                "Authorization": `Bearer ${apiKey}`
            },
        });
    }

    public async processGroceryList (base64Image: string) {
        console.log({base64Image});
        const response = await this._client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: [
                    {
                        type: "text",
                        text: "Process this grocery list and provide a store if given.  Separate the items with a new line and nothing else."
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: base64Image,
                        }
                    }
                ]
            }],
        })
        const split = response.choices[0].message.content?.split('\n').map(s => s?.trim()).filter(Boolean);
        console.log({response});
        return split;
    }
}

export const OPEN_AI_CLIENT_WRAPPER = new OpenAiClientWrapper();
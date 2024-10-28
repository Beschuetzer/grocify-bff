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
            project: "grocify-bff",
        });
    }

    public async processGroceryList (base64Image: string) {
        try {
            const response = await this._client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Process this grocery list.  Provide a store if given."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            }
                        }
                    ]
                }],
            })
            console.log({response, firstChoice: response.choices[0]}) 
        } catch (error) {
            
        }
    }

    public async test () {
        const response = await this._client.chat.completions.create({
            model: this._model,
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                {
                    role: "user",
                    content: "Write a haiku about recursion in programming.",
                },
            ],
        });
        console.log({response});
        return this.test;
    }
}

export const OPEN_AI_CLIENT_WRAPPER = new OpenAiClientWrapper();
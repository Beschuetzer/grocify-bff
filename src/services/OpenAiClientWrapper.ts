import OpenAI from "openai";

class OpenAiClientWrapper {
    private readonly _client: OpenAI;
    private readonly _model = "gpt-4o-mini"

    constructor() {
        const apiKey = process.env.openAiSecret;
        console.log({apiKey});
        
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
        try {
            const response = await this._client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Process the list."
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
            console.log({response, firstChoice: response.choices[0]}) 
            return response
        } catch (error) {
            console.log({error});
        }
    }
}

export const OPEN_AI_CLIENT_WRAPPER = new OpenAiClientWrapper();
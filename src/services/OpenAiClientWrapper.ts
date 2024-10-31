import OpenAI from "openai";
import { EMPTY_NUMBER, EMPTY_STRING } from "../constants";

export type ProcessGroceryListResponse = {
    store: string;
    items: (string | number)[][]
}

class OpenAiClientWrapper {
    private readonly _client: OpenAI;
    private readonly _model = "gpt-4o-mini"
    private splitCharacter = '-'

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

    public async processGroceryList (base64Image: string): Promise<ProcessGroceryListResponse> {
        const response = await this._client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{
                role: "user",
                content: [
                    {
                        type: "text",
                        text: `Process this grocery list.  Separate the items with a new line and nothing else.  Format each response like this 'name ${this.splitCharacter} quantity ${this.splitCharacter} unit'.  The first item should be the store which has no quantity and no unit.  If no store is given, omit it.`
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
        const split = response.choices[0].message.content?.split('\n').map(s => s?.trim()).filter(Boolean);

        if (!split) {
            return {
                store: EMPTY_STRING,
                items: [],
            }
        }

        const isStorePresent = !split[0].includes(this.splitCharacter);
        let store = EMPTY_STRING;
        if (isStorePresent) {
            store = split?.shift()?.replace(/:/, EMPTY_STRING)?.trim() || EMPTY_STRING;
        }

        const items =  split.map(item => {
            const splitItem = item.split(this.splitCharacter);
            return [splitItem[0]?.trim() || EMPTY_STRING, parseInt(splitItem[1]) || EMPTY_NUMBER, splitItem[2]?.trim() || 'unit']
        }); 

        const toReturn = {
            store,
            items,
        }
        console.log({toReturn, isStorePresent, items, store});
        return toReturn;
    }
}

export const OPEN_AI_CLIENT_WRAPPER = new OpenAiClientWrapper();
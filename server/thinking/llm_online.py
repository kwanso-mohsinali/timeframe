from openai import OpenAI
from dotenv import load_dotenv
from config.thinking import MODEL, SYSTEM_PROMPT

load_dotenv()

client = OpenAI()


def think(query: str, context: list):
    print("online thinking started")
    response = client.responses.create(
        model=MODEL,
        service_tier='priority',
        instructions=SYSTEM_PROMPT,
        input=[
            *context,
            {"role": "user", "content": query}
        ]
    )

    result = response.output[0].content[0].text

    return result



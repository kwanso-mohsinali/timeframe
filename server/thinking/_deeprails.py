from deeprails import DeepRails
import threading
from config.thinking import *

# Initialize (env var DEEPRAILS_API_KEY is recommended)
client = DeepRails(api_key=DEEPRAILS_API_KEY)


def defend(user_prompt: str, model_output: str):
    try:
        event_response = client.defend.submit_event(
            workflow_id=DEEPRAILS_WORKFLOW_ID,
            model_input={
                "user_prompt": user_prompt,
                "system_prompt": SYSTEM_PROMPT,
            },
            model_output=model_output,
            model_used=MODEL,
            run_mode="smart"
        )

        print(event_response)

        return event_response
    except Exception:
        pass  # ignore failures


def defend_and_leave(user_prompt: str, model_output: str):
    threading.Thread(
        target=defend,
        args=(user_prompt, model_output),
        daemon=True
    ).start()

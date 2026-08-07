import httpx
import json

def test_chat_flow():
    url = "http://localhost:8000/api/ai/chat"

    prompts = [
        "Why is my ceiling fan spinning but not giving air?",
        "My tap is leaking.",
        "My AC is not cooling."
    ]

    for p in prompts:
        print(f"\n==================================================")
        print(f"[TEST PROMPT]: '{p}'")
        payload = {
            "messages": [
                {"role": "user", "content": p}
            ]
        }
        try:
            resp = httpx.post(url, json=payload, timeout=25.0)
            if resp.status_code == 200:
                data = resp.json()
                print(f"[SUCCESS] Status 200 OK | Provider Used: {data.get('provider_used')}")
                reply = data.get('reply', '')
                print(f"Response Length: {len(reply)} chars")
                clean_preview = reply[:300].encode('ascii', 'ignore').decode('ascii')
                print(f"Preview:\n{clean_preview}...\n")
            else:
                print(f"[ERROR] {resp.status_code}: {resp.text}")
        except Exception as e:
            print("[EXCEPTION]:", e)

    # Test Conversational Memory (Multi-turn Chat)
    print("\n==================================================")
    print("[TESTING MULTI-TURN CONVERSATIONAL MEMORY]...")
    multi_turn_payload = {
        "messages": [
            {"role": "user", "content": "I have an LG Split AC unit model 2023 in my bedroom."},
            {"role": "assistant", "content": "Got it! I see you have an LG Split AC unit (2023 model). How can I help you with it?"},
            {"role": "user", "content": "It is blowing warm air and showing error code CH 38. What does that mean and how do I fix it?"}
        ]
    }
    try:
        resp = httpx.post(url, json=multi_turn_payload, timeout=25.0)
        if resp.status_code == 200:
            data = resp.json()
            print(f"[SUCCESS] Status 200 OK | Provider Used: {data.get('provider_used')}")
            reply = data.get('reply', '')
            print(f"Multi-turn Response Length: {len(reply)} chars")
            clean_preview = reply[:350].encode('ascii', 'ignore').decode('ascii')
            print(f"Multi-turn Reply Preview:\n{clean_preview}...\n")
        else:
            print(f"[ERROR] Multi-turn {resp.status_code}: {resp.text}")
    except Exception as e:
        print("[EXCEPTION]:", e)

if __name__ == "__main__":
    test_chat_flow()

import httpx
import json

def test_ai():
    url = "http://localhost:8000/api/ai/chat"
    payload = {
        "messages": [
            {"role": "user", "content": "Why is my ceiling fan spinning but not giving air?"}
        ]
    }
    print("Testing API request to FastAPI AI Gateway...")
    try:
        response = httpx.post(url, json=payload, timeout=25.0)
        print("Status Code:", response.status_code)
        data = response.json()
        print("Provider Used:", data.get("provider_used"))
        print("Reply Snippet:\n", data.get("reply", "")[:300])
    except Exception as e:
        print("Error testing chat endpoint:", e)

if __name__ == "__main__":
    test_ai()

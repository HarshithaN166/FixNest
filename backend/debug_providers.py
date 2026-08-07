import asyncio
from ai_gateway import ai_gateway, get_env_keys

async def test_all_providers():
    keys = get_env_keys()
    print("Environment Keys Check:")
    for k, v in keys.items():
        masked = v[:6] + "..." + v[-4:] if len(v) > 10 else ("Unconfigured" if not v else "Short")
        print(f"  {k}: {masked}")

    test_messages = [{"role": "user", "content": "Why is my ceiling fan spinning but not giving air?"}]

    print("\n--- Testing 1: Google Gemini ---")
    if keys["GEMINI"]:
        try:
            res = await ai_gateway._call_gemini(test_messages, keys["GEMINI"])
            print("Gemini SUCCESS:\n", res[:200])
        except Exception as e:
            print("Gemini ERROR:", e)

    print("\n--- Testing 2: OpenAI GPT-4o ---")
    if keys["OPENAI"]:
        try:
            res = await ai_gateway._call_openai(test_messages, keys["OPENAI"])
            print("OpenAI SUCCESS:\n", res[:200])
        except Exception as e:
            print("OpenAI ERROR:", e)

    print("\n--- Testing 3: Anthropic Claude ---")
    if keys["ANTHROPIC"]:
        try:
            res = await ai_gateway._call_claude(test_messages, keys["ANTHROPIC"])
            print("Claude SUCCESS:\n", res[:200])
        except Exception as e:
            print("Claude ERROR:", e)

    print("\n--- Testing 4: Groq ---")
    if keys["GROQ"]:
        try:
            res = await ai_gateway._call_groq(test_messages, keys["GROQ"])
            print("Groq SUCCESS:\n", res[:200])
        except Exception as e:
            print("Groq ERROR:", e)

    print("\n--- Testing 5: OpenRouter ---")
    if keys["OPENROUTER"]:
        try:
            res = await ai_gateway._call_openrouter(test_messages, keys["OPENROUTER"])
            print("OpenRouter SUCCESS:\n", res[:200])
        except Exception as e:
            print("OpenRouter ERROR:", e)

if __name__ == "__main__":
    asyncio.run(test_all_providers())

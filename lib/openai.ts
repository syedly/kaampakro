import OpenAI from "openai"

export function getOpenAIClient(apiKey?: string): OpenAI {
  const key = apiKey || process.env.OPENAI_API_KEY

  if (!key || !key.startsWith("sk-")) {
    throw new Error("Invalid or missing OpenAI API key")
  }

  return new OpenAI({ apiKey: key })
}

import "server-only"

const DEFAULT_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
/** Fast default — mistral-large-675b can take 60s+ on free tier */
const DEFAULT_FAST_MODEL = "stepfun-ai/step-3.5-flash"

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string }

export async function nvidiaChat(
  messages: ChatMessage[],
  options?: {
    maxTokens?: number
    temperature?: number
    model?: string
    timeoutMs?: number
  },
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    throw new Error("NVIDIA_API_KEY is not configured in .env.local")
  }

  const url = process.env.NVIDIA_API_URL ?? DEFAULT_URL
  // Prefer fast model; mistral-large-675b often takes 60s+ on free tier
  const model =
    options?.model ??
    process.env.NVIDIA_AI_FAST_MODEL ??
    DEFAULT_FAST_MODEL

  const timeoutMs = options?.timeoutMs ?? Number(process.env.NVIDIA_AI_TIMEOUT_MS ?? 25000)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: options?.maxTokens ?? 512,
        temperature: options?.temperature ?? 0.2,
        top_p: 1,
        stream: false,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`NVIDIA API error (${res.status}): ${errText.slice(0, 300)}`)
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error("Empty response from NVIDIA API")
    return content
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `AI request timed out after ${timeoutMs / 1000}s. Try a shorter prompt or set NVIDIA_AI_FAST_MODEL to a faster endpoint.`,
      )
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export function parseJsonFromModel<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const raw = fenced ? fenced[1].trim() : text.trim()
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start === -1 || end === -1) throw new Error("Model did not return valid JSON")
  return JSON.parse(raw.slice(start, end + 1)) as T
}

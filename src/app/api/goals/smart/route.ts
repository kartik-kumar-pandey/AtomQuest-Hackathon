import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, uom, target } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required for AI enhancement." }, { status: 400 })
    }

    const apiKey = process.env.NVIDIA_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "AI API key not configured on the server." }, { status: 500 })
    }

    const invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"

    // Construct the prompt to ask for a JSON response
    const systemPrompt = `You are an expert HR and Management consultant. Your task is to transform a drafted employee goal into a high-quality SMART (Specific, Measurable, Achievable, Relevant, Time-bound) goal.
You will be provided with the current Draft Title, Description, Unit of Measurement (UoM), and Target.
You must return the improved goal STRICTLY as a JSON object with the following keys:
- "title": A concise, clear, and action-oriented SMART goal title.
- "description": A detailed explanation of how this goal will be achieved and why it matters.
- "target": A numeric target (integer) that is realistic and aligns with the new title.
- "uom": Choose the most appropriate from: "MIN" (higher is better), "MAX" (lower is better), "TIMELINE", "ZERO".

Example input:
Title: "Make app faster"
Description: ""
Target: 5
UoM: "MAX"

Example output:
{
  "title": "Reduce application initial load time by optimizing frontend assets",
  "description": "Improve user experience by reducing the initial page load time. This will involve minifying CSS/JS, lazy-loading images, and optimizing server response times.",
  "target": 2,
  "uom": "MAX"
}

Do NOT wrap the JSON in Markdown formatting blocks (no \`\`\`json). Output raw, parseable JSON only.`

    const userPrompt = `Draft Title: "${title}"\nDraft Description: "${description || ""}"\nCurrent Target: ${target || 0}\nCurrent UoM: "${uom || "MIN"}"`

    const payload = {
      model: "mistralai/mistral-large-3-675b-instruct-2512",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1024,
      temperature: 0.3, // Low temperature for consistent JSON
      top_p: 1.0,
      stream: false
    }

    const response = await fetch(invoke_url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("NVIDIA API Error:", text)
      return NextResponse.json({ error: "AI service failed to respond correctly." }, { status: 502 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "AI returned an empty response." }, { status: 500 })
    }

    try {
      // Sometimes models wrap json in markdown despite instructions
      const cleanContent = content.replace(/```json/g, "").replace(/```/g, "").trim()
      const jsonResponse = JSON.parse(cleanContent)
      return NextResponse.json(jsonResponse)
    } catch (parseError) {
      console.error("Failed to parse AI JSON:", content)
      return NextResponse.json({ error: "AI returned invalid format." }, { status: 500 })
    }
  } catch (error: any) {
    console.error("SMART Goal POST Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

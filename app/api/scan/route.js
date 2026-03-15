import Groq from "groq-sdk"

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(request) {
  try {
    const { image: imageBase64 } = await request.json()

    if (!imageBase64) {
      return Response.json({ error: "No image provided" }, { status: 400 })
    }

    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          { type: "text", text: `Identify all food ingredients visible in this image. Return ONLY valid JSON with no explanation: {"ingredients": [{"name": "chicken breast", "quantity": "2", "unit": "pieces"}]}` }
        ]
      }],
      max_tokens: 500
    })

    const raw = response.choices[0].message.content.replace(/```json|```/g, "").trim()
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in response")
    const data = JSON.parse(jsonMatch[0])
    return Response.json(data)

  } catch (error) {
    console.error("Scan endpoint error:", error.message)
    return Response.json({ error: "Failed to scan image", details: error.message }, { status: 500 })
  }
}
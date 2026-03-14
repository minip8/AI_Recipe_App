import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json()

    if (!imageBase64) {
      return Response.json({ error: "No image provided" }, { status: 400 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const result = await model.generateContent([
      {
        inlineData: { data: imageBase64, mimeType: "image/jpeg" }
      },
      `Identify all food ingredients visible in this image.
       Return ONLY valid JSON with no explanation:
       {
         "ingredients": [
           {
             "name": "chicken breast",
             "quantity": "2",
             "unit": "pieces"
           }
         ]
       }`
    ])

    const raw = result.response.text().replace(/```json|```/g, "").trim()
    const data = JSON.parse(raw)
    return Response.json(data)

  } catch (error) {
    console.error("Scan endpoint error:", error.message, error.stack)
    return Response.json({ error: "Failed to scan image", details: error.message }, { status: 500 })
  }
}

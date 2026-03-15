import Groq from "groq-sdk"
import { supabase } from '../../../lib/supabase'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

function cleanJSON(str) {
  return str
    .replace(/```json|```/g, "")
    .replace(/[\x00-\x1F\x7F]/g, " ") // remove control characters
    .replace(/,\s*}/g, "}")            // trailing commas in objects
    .replace(/,\s*]/g, "]")            // trailing commas in arrays
    .trim()
}

export async function POST(request) {
  try {
    const { ingredients, profile, share, excludeTitle } = await request.json()


    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a personal chef AI. Generate a single recipe using the provided ingredients.
          Dietary mode: ${profile?.dietary_mode || "none"}
          Allergies to avoid: ${profile?.allergies?.join(", ") || "none"}
          ${excludeTitle ? `Do NOT make "${excludeTitle}" or anything similar. Be creative and suggest something completely different.` : ""}

          
          You MUST respond with ONLY a valid JSON object, no extra text, no markdown, no backticks.
          Use this exact structure:
          {
            "title": "Recipe name",
            "description": "One sentence description",
            "prepTime": 10,
            "cookTime": 20,
            "servings": 2,
            "ingredients": [{ "name": "egg", "quantity": "2", "unit": "pieces" }],
            "steps": ["Step 1", "Step 2"]
          }`
        },
        {
          role: "user",
          content: `Available ingredients: ${JSON.stringify(ingredients)}`
        }
      ]
    })

    let raw = response.choices[0].message.content
    raw = cleanJSON(raw)

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in response")
    raw = jsonMatch[0]

    let recipe
    try {
      recipe = JSON.parse(raw)
    } catch (parseErr) {
      console.error("Raw response that failed to parse:", raw)
      throw new Error("Failed to parse recipe JSON: " + parseErr.message)
    }

    if (share && supabase) {
      try {
        const { data, error } = await supabase
          .from('recipes')
          .insert({
            title: recipe.title,
            description: recipe.description,
            prep_time: recipe.prepTime,
            cook_time: recipe.cookTime,
            servings: recipe.servings,
            ingredients: recipe.ingredients,
            steps: recipe.steps,
            ratings_count: 0,
            average_rating: 0
          })
          .select('id')
          .single()

        if (!error) {
          recipe.sharedId = data.id
        }
      } catch (err) {
        console.error('Error sharing recipe:', err)
      }
    }

    return Response.json(recipe)

  } catch (err) {
    console.error('Generate error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
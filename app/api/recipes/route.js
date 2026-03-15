import { supabase } from '../../../lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }
  try {
    const { title, description, prepTime, cookTime, servings, ingredients, steps } = await request.json()

    const { data, error } = await supabase
      .from('recipes')
      .insert({
        title,
        description,
        prep_time: prepTime,
        cook_time: cookTime,
        servings,
        ingredients,
        steps,
        ratings_count: 0,
        average_rating: 0
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id })
  } catch (error) {
    console.error('Error saving recipe:', error)
    return NextResponse.json({ error: 'Failed to save recipe' }, { status: 500 })
  }
}

export async function GET(request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit')) || 20
  const offset = parseInt(searchParams.get('offset')) || 0

  try {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CATEGORIES } from "@/lib/constants"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Try to get categories from Supabase
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    // If error or no data, return static categories as fallback
    if (error || !data || data.length === 0) {
      return NextResponse.json({ categories: CATEGORIES.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        emoji: cat.icon || null,
        description: cat.description || null,
        is_premium: false,
        created_at: new Date().toISOString(),
      })) })
    }

    return NextResponse.json({ categories: data })
  } catch (error: any) {
    // Fallback to static categories if there's any error
    return NextResponse.json({ categories: CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      emoji: cat.icon || cat.emoji,
      description: cat.description,
      is_premium: false,
      created_at: new Date().toISOString(),
    })) })
  }
}


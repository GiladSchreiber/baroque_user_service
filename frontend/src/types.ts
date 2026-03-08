export interface MenuItem {
  id?: string
  menu_type: string
  category: string
  name_en: string
  name_he: string
  description_en: string | null
  description_he: string | null
  price_display: string
  price_note_en?: string | null
  price_note_he?: string | null
  is_vegetarian: boolean
  is_seasonal: boolean
}

export interface MenuItem {
  menu_type: string
  category: string
  name_en: string
  name_he: string
  description_en: string | null
  description_he: string | null
  price_display: string
  is_vegetarian: boolean
  is_seasonal: boolean
}

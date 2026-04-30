import type { User, Listing, Category, Conversation, Message, Review, Role, ListingStatus } from '@prisma/client'

export type { Role, ListingStatus }

export interface SafeUser {
  id: string
  phone: string
  name: string | null
  avatar: string | null
  description: string | null
  city: string | null
  role: Role
  isVerified: boolean
  isBanned: boolean
  rating: number
  reviewCount: number
  createdAt: Date
}

export interface ListingWithSeller extends Listing {
  seller: Pick<User, 'id' | 'name' | 'avatar' | 'phone' | 'rating' | 'reviewCount' | 'isVerified'>
  category: Category
  _count?: {
    favorites: number
  }
  isFavorited?: boolean
}

export interface ListingWithDetails extends ListingWithSeller {
  conversations?: Conversation[]
}

export interface ConversationWithDetails extends Conversation {
  members: Array<{
    user: Pick<User, 'id' | 'name' | 'avatar' | 'phone'>
    lastReadAt: Date | null
  }>
  messages: Array<MessageWithSender>
  listing?: Pick<Listing, 'id' | 'title' | 'price' | 'images'> | null
  lastMessage?: MessageWithSender | null
  unreadCount?: number
}

export interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'name' | 'avatar'>
}

export interface ReviewWithAuthor extends Review {
  author: Pick<User, 'id' | 'name' | 'avatar'>
}

// Category-specific attribute types

export interface ElectronicsAttributes {
  brand?: string
  model?: string
  condition?: 'new' | 'used' | 'refurbished'
  subcategory?: string
  memory?: string
  storage?: string
}

export interface CarsAttributes {
  brand?: string
  model?: string
  year?: number
  mileage?: number
  fuelType?: 'petrol' | 'diesel' | 'electric' | 'hybrid'
  transmission?: 'manual' | 'automatic'
  bodyType?: string
  color?: string
  engineVolume?: number
}

export interface RealEstateAttributes {
  propertyType?: 'apartment' | 'house' | 'room' | 'land' | 'commercial'
  area?: number
  rooms?: number
  floor?: number
  totalFloors?: number
  dealType?: 'sale' | 'rent'
  furnished?: boolean
  newBuilding?: boolean
}

export interface ClothingAttributes {
  gender?: 'male' | 'female' | 'unisex' | 'kids'
  size?: string
  brand?: string
  color?: string
  condition?: 'new' | 'used'
  subcategory?: string
}

export interface ServicesAttributes {
  subcategory?: string
  experience?: string
  workSchedule?: string
  remote?: boolean
}

export type CategoryAttributes =
  | ElectronicsAttributes
  | CarsAttributes
  | RealEstateAttributes
  | ClothingAttributes
  | ServicesAttributes
  | Record<string, unknown>

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ListingsFilter {
  categorySlug?: string
  city?: string
  priceMin?: number
  priceMax?: number
  query?: string
  page?: number
  pageSize?: number
  sortBy?: 'createdAt' | 'price' | 'views'
  sortOrder?: 'asc' | 'desc'
  attributes?: Record<string, string | number | boolean>
}

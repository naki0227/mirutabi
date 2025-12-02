import { Timestamp } from 'firebase/firestore';

export type TravelStyle = '爆速コスパ' | '快適計画' | '贅沢体験';

export interface Companion {
  name: string;
  relationship: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  health_notes?: string;
}

export interface User {
  user_id: string;
  email?: string;
  display_name?: string;
  photo_url?: string;
  style_result?: TravelStyle;
  followers_count: number;

  // Profile
  gender?: 'male' | 'female' | 'other';
  age?: number;
  residence?: string;
  health_notes?: string;
  companions?: Companion[];
  tags?: string[];

  // Concierge Data
  health_profile?: {
    avg_steps: number;
    stamina: 'low' | 'medium' | 'high';
  };
  sns_preferences?: {
    music: string[];
    food: string[];
  };
  saved_posts?: string[]; // List of post_ids

  push_settings: {
    price_alert: boolean;
    reminder: boolean;
    [key: string]: boolean;
  };
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Spot {
  spot_id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  price_history: {
    date: Timestamp;
    price: number;
  }[];
  affiliate_links: {
    provider: string;
    url: string;
  }[];
  description?: string;
  images?: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Video {
  video_id: string;
  uploader_id: string;
  video_url: string;
  thumbnail_url: string;
  linked_spots: string[]; // spot_ids
  status: 'public' | 'private' | 'pending';
  likes_count: number;
  description?: string;
  tags?: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface RouteStop {
  spot_id: string;
  order: number;
  type?: 'flight' | 'train' | 'bus' | 'meal' | 'activity' | 'accommodation' | 'other';
  arrival_time?: Timestamp;
  departure_time?: Timestamp;
  stop_name: string;
  stop_name_en?: string;
  stop_name_zh?: string;
  stop_name_ko?: string;
  notes?: string;
  notes_en?: string;
  notes_zh?: string;
  notes_ko?: string;
  cost_estimate?: number;
  cost_estimate_usd?: number;
  details?: string;
  booking_url?: string;
  recommended_date?: string;
  time_zone?: string;
  image_url?: string;
  rating?: number;
  address?: string;
  alternatives?: {
    name: string;
    cost_estimate: number;
    cost_estimate_usd?: number;
    details?: string;
    booking_url?: string;
    type: string; // 'meal' | 'accommodation'
  }[];
}

export interface Route {
  route_id: string;
  creator_id: string;
  author_name?: string;
  author_image?: string;
  title: string;
  is_public: boolean;
  likes_count: number;
  travel_style_fit?: TravelStyle;
  reused_count: number;
  stops: RouteStop[];
  total_budget?: number;
  duration_days?: number;
  images?: string[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Comment {
  comment_id: string;
  route_id?: string;
  post_id?: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  content: string;
  created_at: Timestamp;
}

export interface Post {
  post_id: string;
  user_id: string;
  user_name: string;
  user_image?: string;
  media_type: 'photo' | 'video';
  media_url: string;
  thumbnail_url?: string; // For videos
  caption: string;
  location?: {
    name: string;
    lat: number;
    lng: number;
  };
  likes_count: number;
  created_at: Timestamp;
}

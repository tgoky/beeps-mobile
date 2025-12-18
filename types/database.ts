// User roles and types
export type UserRole = 'ARTIST' | 'PRODUCER' | 'STUDIO_OWNER' | 'GEAR_SELLER' | 'LYRICIST';
export type MembershipTier = 'FREE' | 'BASIC' | 'PRO' | 'PREMIUM';

// User and Profile types
export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  primaryRole?: UserRole;
  verified: boolean;
  membershipTier: MembershipTier;
  followersCount: number;
  followingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ArtistProfile {
  id: string;
  userId: string;
  genres: string[];
  skills: string[];
  createdAt: string;
  updatedAt: string;
}

export interface  ProducerProfile {
  id: string;
  userId: string;
  genres: string[];
  specialties: string[];
  equipment: string[];
  experience: number;
  productionRate?: number;
  songwritingRate?: number;
  mixingRate?: number;
  availability: string;
  createdAt: string;
  updatedAt: string;
}

// Beat types
export interface Beat {
  id: string;
  title: string;
  description?: string;
  producerId: string;
  clubId?: string;
  bpm?: number;
  key?: string;
  price: number;
  type: string;
  genres: string[];
  moods: string[];
  tags: string[];
  imageUrl?: string;
  audioUrl: string;
  plays: number;
  likes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Studio types
export interface Studio {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  clubId?: string;
  location: string;  // Combined location string (required in Prisma schema)
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  hourlyRate: number;
  equipment: string[];
  capacity?: string;  // Changed from number to string to match Prisma schema
  imageUrl?: string;
  rating: number;
  reviewsCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Equipment types
export interface Equipment {
  id: string;
  name: string;
  description?: string;
  category: string;
  sellerId: string;
  clubId?: string;
  price?: number;
  rentalRate?: number;
  condition: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Collaboration types
export type CollaborationType = 'PROJECT' | 'SESSION' | 'GIG' | 'AUCTION';
export type CollaborationStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Collaboration {
  id: string;
  type: CollaborationType;
  status: CollaborationStatus;
  title: string;
  description?: string;
  creatorId: string;
  studioId?: string;
  price?: number;
  minBid?: number;
  currentBid?: number;
  duration?: number;
  location?: string;
  genre?: string;
  equipment?: string[];
  slots?: number;
  availableDate?: string;
  expiresAt?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Service Request types
export type ServiceRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';

export interface ServiceRequest {
  id: string;
  clientId: string;
  producerId: string;
  projectTitle: string;
  projectDescription?: string;
  budget?: number;
  deadline?: string;
  status: ServiceRequestStatus;
  producerResponse?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Community types
export type CommunityRole = 'ARTIST' | 'PRODUCER' | 'STUDIO_OWNER' | 'GEAR_SELLER' | 'LYRICIST';

export interface CommunityPost {
  id: string;
  authorId: string;
  communityRole: CommunityRole;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
}

// Booking types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Booking {
  id: string;
  studioId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Club types - Aligned with web app Prisma schema
export type ClubType = 'RECORDING' | 'PRODUCTION' | 'RENTAL' | 'MANAGEMENT' | 'DISTRIBUTION' | 'CREATIVE';

export interface Club {
  id: string;
  name: string;
  type: ClubType;
  description?: string;
  icon: string; // Emoji icon (e.g., 🎵, 🎸, etc.)
  ownerId: string; // Changed from creatorId to match Prisma schema
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ClubMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ClubMembership {
  id: string;
  clubId: string;
  userId: string;
  role: ClubMemberRole;
  joinedAt: string;
}

// User Role Grant - for accessing communities
export interface UserRoleGrant {
  id: string;
  userId: string;
  roleType: UserRole;
  grantedBy?: string; // Club ID that granted this role
  createdAt: string;
}

// Transaction types
export type TransactionType = 'BEAT_PURCHASE' | 'EQUIPMENT_PURCHASE' | 'STUDIO_BOOKING' | 'SERVICE_PAYMENT' | 'SUBSCRIPTION';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  referenceId?: string;
  referenceType?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

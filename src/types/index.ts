// ==============================================================================
// Brainnote AI — Domain Model & Cross-Platform TypeScript Type Definitions
// ==============================================================================

export type SubscriptionTier = 'trial' | 'pro' | 'team';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export type SourceType = 'youtube' | 'pdf' | 'audio' | 'video' | 'web' | 'meeting' | 'presentation' | 'document';
export type SourceProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type AIArtifactType = 
  | 'summary' 
  | 'meeting_minutes' 
  | 'action_items' 
  | 'study_guide' 
  | 'flashcards' 
  | 'quiz' 
  | 'qa'
  | 'interview_qa';

export type PrimaryNavSection = 
  | 'home' 
  | 'library' 
  | 'web_sources'
  | 'meetings' 
  | 'documents' 
  | 'videos' 
  | 'ai_chat' 
  | 'study_tools' 
  | 'interview_prep'
  | 'settings';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  tier: SubscriptionTier;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  avatarUrl?: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planTier: SubscriptionTier;
  status: SubscriptionStatus;
  trialStart: string;
  trialEnd: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  hasPaymentMethod?: boolean;
  paymentMethodDetails?: {
    brand: string;
    last4: string;
    expMonth?: number;
    expYear?: number;
  };
  subscriptionRequiredForTrial?: boolean;
}

export interface UsageRecord {
  tenantId: string;
  aiTokensConsumed: number;
  aiTokensLimit: number;
  storageBytesConsumed: number;
  storageBytesLimit: number;
  notesCount: number;
  notesLimit: number;
  audioMinutesTranscribed: number;
  audioMinutesLimit: number;
}

export interface Folder {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  color: string;
  icon?: string;
  parentId?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  tenantId: string;
  name: string;
  color: string;
}

export interface CitationAnchor {
  sourceId: string;
  sourceTitle: string;
  sourceType: SourceType;
  timestampSeconds?: number;
  pageNumber?: number;
  citationText: string;
  formattedReference: string; // e.g. "[YouTube @ 12:45]" or "[PDF p. 14]"
}

export interface NoteSource {
  id: string;
  tenantId: string;
  noteId: string;
  sourceType: SourceType;
  title: string;
  sourceUrl?: string;
  fileSizeBytes?: number;
  durationSeconds?: number;
  rawTranscript?: string;
  processingStatus: SourceProcessingStatus;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Flashcard {
  front: string;
  back: string;
  hint?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee?: string;
  completed: boolean;
  dueDate?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  difficulty: 'Junior' | 'Mid-Level' | 'Senior' | 'Staff/Principal';
  category: 'Conceptual' | 'Coding & Architecture' | 'System Design' | 'Evaluation & Edge Cases';
  answer: string;
  keyCriteria: string[]; // What the interviewer looks for in the response
  codeSnippet?: string;
  followUpQuestions?: string[];
  userStatus?: 'unreviewed' | 'needs_practice' | 'mastered';
}

export interface AIArtifact {
  id: string;
  tenantId: string;
  noteId: string;
  userId: string;
  artifactType: AIArtifactType;
  title: string;
  content: {
    summaryText?: string;
    keyTakeaways?: string[];
    actionItems?: ActionItem[];
    meetingMinutes?: {
      attendees?: string[];
      agenda?: string[];
      discussionPoints?: string[];
      decisions?: string[];
    };
    studyGuide?: {
      topics?: { title: string; explanation: string }[];
      glossary?: { term: string; definition: string }[];
    };
    flashcards?: Flashcard[];
    quiz?: {
      questions: QuizQuestion[];
    };
    qaAnswers?: { question: string; answer: string; citations?: CitationAnchor[] }[];
    interviewQA?: {
      questions: InterviewQuestion[];
    };
    questions?: InterviewQuestion[] | QuizQuestion[];
  };
  modelUsed: string;
  tokensConsumed: number;
  createdAt: string;
}

export interface Note {
  id: string;
  tenantId: string;
  userId: string;
  folderId?: string;
  title: string;
  content: string;
  isPinned: boolean;
  isArchived: boolean;
  tags: Tag[];
  sources: NoteSource[];
  aiArtifacts: AIArtifact[];
  createdAt: string;
  updatedAt: string;
}

export interface Collaborator {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'editor' | 'viewer';
  status: 'active' | 'invited';
  invitedAt: string;
}

export interface ShareLink {
  id: string;
  noteId: string;
  tenantId: string;
  accessLevel: 'view' | 'edit';
  shareUrl: string;
  allowPublicEdits: boolean;
  createdAt: string;
}


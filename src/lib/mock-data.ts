import { Tenant, User, Subscription, UsageRecord, Note, Folder, Tag, Collaborator } from '@/types';

export interface TenantDataset {
  tenant: Tenant;
  user: User;
  subscription: Subscription;
  usage: UsageRecord;
  folders: Folder[];
  tags: Tag[];
  notes: Note[];
  collaborators?: Collaborator[];
}

export const INITIAL_TENANTS: Record<string, TenantDataset> = {
  'tenant-acme': {
    tenant: {
      id: 'tenant-acme',
      name: 'Acme AI Labs',
      slug: 'acme-labs',
      tier: 'trial',
      createdAt: '2026-10-20T10:00:00Z',
    },
    user: {
      id: 'user-alex',
      tenantId: 'tenant-acme',
      email: 'alex@acmelabs.ai',
      name: 'Alex Rivera',
      role: 'owner',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    },
    subscription: {
      id: 'sub-acme',
      tenantId: 'tenant-acme',
      planTier: 'trial',
      status: 'trialing',
      trialStart: '2026-10-20T10:00:00Z',
      trialEnd: '2026-10-27T10:00:00Z', // 1 day remaining
      cancelAtPeriodEnd: false,
      hasPaymentMethod: true,
      paymentMethodDetails: {
        brand: 'Visa',
        last4: '4242',
      },
    },
    usage: {
      tenantId: 'tenant-acme',
      aiTokensConsumed: 18450,
      aiTokensLimit: 50000,
      storageBytesConsumed: 42 * 1024 * 1024,
      storageBytesLimit: 250 * 1024 * 1024,
      notesCount: 1,
      notesLimit: 25,
      audioMinutesTranscribed: 14,
      audioMinutesLimit: 30,
    },
    folders: [
      { id: 'f-1', tenantId: 'tenant-acme', userId: 'user-alex', name: 'Product Strategy', color: '#8B5CF6', createdAt: '2026-10-20T11:00:00Z' },
      { id: 'f-2', tenantId: 'tenant-acme', userId: 'user-alex', name: 'Engineering Architecture', color: '#06B6D4', createdAt: '2026-10-21T09:00:00Z' },
      { id: 'f-3', tenantId: 'tenant-acme', userId: 'user-alex', name: 'Executive Meetings', color: '#10B981', createdAt: '2026-10-22T14:00:00Z' },
    ],
    tags: [
      { id: 't-1', tenantId: 'tenant-acme', name: 'Strategy', color: '#8B5CF6' },
      { id: 't-2', tenantId: 'tenant-acme', name: 'AI Models', color: '#06B6D4' },
      { id: 't-3', tenantId: 'tenant-acme', name: 'Q4 Priorities', color: '#F59E0B' },
      { id: 't-4', tenantId: 'tenant-acme', name: 'Architecture', color: '#10B981' },
    ],
    collaborators: [
      {
        id: 'collab-1',
        tenantId: 'tenant-acme',
        email: 'alex@acmelabs.ai',
        name: 'Alex Rivera (Owner)',
        role: 'editor',
        status: 'active',
        invitedAt: '2026-10-20T10:00:00Z',
      },
      {
        id: 'collab-2',
        tenantId: 'tenant-acme',
        email: 'sarah.chen@acmelabs.ai',
        name: 'Sarah Chen',
        role: 'editor',
        status: 'active',
        invitedAt: '2026-10-22T14:30:00Z',
      },
    ],
    notes: [
      {
        id: 'note-user-ai-video-tools',
        tenantId: 'tenant-acme',
        userId: 'user-alex',
        folderId: 'f-1',
        title: '(79) Top 5 Free AI Video Generator Tools Without Watermark🔥Unlimited Image to Video AI FREE ✨',
        content: `### Video Analysis: Top 5 Free AI Video Generator Tools Without Watermark
**Source:** YouTube Video (Timestamp Stream & Auto-Sync)
**Category:** Generative AI & Image-to-Video Tools

#### Overview of Key Tools Mentioned
1. **Luma Dream Machine:** High-fidelity video generation from text and image prompts with fluid camera movements and realistic physics.
2. **Kling AI:** High-motion consistency with 5-10 second generations, realistic physics, character coherence, and zero watermark exports.
3. **Haiper AI:** Free video creation platform supporting text-to-video, image animation, and video repainting with daily renewable credits.
4. **Vidu AI:** Multi-modal video synthesizer with dynamic physics, anime and realistic styles.
5. **Pika Labs (Pika 1.0):** Cinematic effects, sound effect integration, regional modifications, and prompt motion controls.

#### Key Takeaways for Watermark-Free AI Production
- **Image-to-Video Workflow:** Generate high-resolution starter images in Midjourney or Flux, then animate using Kling AI or Luma Dream Machine to maintain visual consistency.
- **Physics Simulation:** Modern 2026 DiT (Diffusion Transformer) models simulate momentum and lighting changes natively without post-processing artifacts.
- **Export Formats:** Full HD exports without watermark overlays enable direct commercial use.

#### Action Items Captured
- [ ] Finalize browser extension side panel packaging for Top 5 Free AI Video Generator Tools (Due: 2026-11-02)
- [ ] Verify source citation anchors against YouTube timestamp stream (Due: 2026-11-04)
- [ ] Audit GDPR data export and deletion endpoints for tenant compliance`,
        isPinned: true,
        isArchived: false,
        tags: [
          { id: 't-yt-video', tenantId: 'tenant-acme', name: 'AI Video', color: '#E11D48' },
          { id: 't-free-tools', tenantId: 'tenant-acme', name: 'Free Tools', color: '#059669' },
          { id: 't-yt-source', tenantId: 'tenant-acme', name: 'YouTube', color: '#EF4444' },
        ],
        sources: [
          {
            id: 'src-yt-video-1',
            tenantId: 'tenant-acme',
            noteId: 'note-user-ai-video-tools',
            sourceType: 'youtube',
            title: '(79) Top 5 Free AI Video Generator Tools Without Watermark🔥Unlimited Image to Video AI FREE ✨',
            sourceUrl: 'https://www.youtube.com/watch?v=ai-video-generators-free',
            durationSeconds: 780,
            rawTranscript: `[00:00:10] In this video, I will show you the top 5 free AI video generator tools without any watermark.
[00:02:15] Tool number one is Kling AI, allowing unlimited high-definition video generation and realistic physics.
[00:05:40] Tool number two is Luma Dream Machine with hyper-realistic camera angles and rapid prompt rendering.
[00:08:30] Tool number three is Haiper AI, offering free daily video credits for image-to-video animation.
[00:10:45] Tool number four is Vidu AI, supporting dynamic physics and anime styles.
[00:12:10] Tool number five is Pika Labs with regional repainting and sound generation.`,
            processingStatus: 'completed',
            createdAt: '2026-10-27T10:00:00Z',
          },
        ],
        aiArtifacts: [
          {
            id: 'art-yt-summary',
            tenantId: 'tenant-acme',
            noteId: 'note-user-ai-video-tools',
            userId: 'user-alex',
            artifactType: 'summary',
            title: 'Executive AI Synthesis: Free AI Video Generators',
            content: {
              summaryText: 'Comprehensive breakdown of the top 5 free AI video generation tools offering watermark-free high-definition exports in 2026, comparing Kling AI, Luma Dream Machine, Haiper AI, Vidu, and Pika Labs.',
              keyTakeaways: [
                'Kling AI and Luma Dream Machine lead in temporal consistency and realistic motion physics.',
                'Image-to-video prompting preserves character facial identity and lighting far better than pure text prompts.',
                'Haiper AI provides renewable free daily credits ideal for prototyping watermark-free clips.',
              ],
            },
            modelUsed: 'Gemini 1.5 Pro',
            tokensConsumed: 1850,
            createdAt: '2026-10-27T10:05:00Z',
          },
          {
            id: 'art-yt-actions',
            tenantId: 'tenant-acme',
            noteId: 'note-user-ai-video-tools',
            userId: 'user-alex',
            artifactType: 'action_items',
            title: 'Action Items & Milestones',
            content: {
              actionItems: [
                {
                  id: 'act-1',
                  task: 'Finalize browser extension side panel packaging for Top 5 Free AI Video Generator Tools',
                  completed: false,
                  dueDate: '2026-11-02',
                },
                {
                  id: 'act-2',
                  task: 'Verify source citation anchors against YouTube timestamp stream',
                  completed: false,
                  dueDate: '2026-11-04',
                },
                {
                  id: 'act-3',
                  task: 'Audit GDPR data export and deletion endpoints for tenant compliance',
                  completed: false,
                },
              ],
            },
            modelUsed: 'Gemini 1.5 Pro',
            tokensConsumed: 1200,
            createdAt: '2026-10-27T10:06:00Z',
          },
          {
            id: 'art-yt-study',
            tenantId: 'tenant-acme',
            noteId: 'note-user-ai-video-tools',
            userId: 'user-alex',
            artifactType: 'flashcards',
            title: 'AI Video Tools Study Deck',
            content: {
              flashcards: [
                {
                  front: 'What are the top advantages of Kling AI and Luma Dream Machine for video creators?',
                  back: 'They deliver fluid temporal consistency, realistic physics, and clean 1080p exports without watermarks.',
                  hint: 'Focus on motion quality and export restrictions.',
                },
                {
                  front: 'Why is Image-to-Video (I2V) preferred over Text-to-Video (T2V) for consistent characters?',
                  back: 'Image-to-Video anchors the character facial structure, clothing, and environment from the source keyframe, preventing prompt drift across frames.',
                  hint: 'Source reference keyframe anchoring.',
                },
                {
                  front: 'How does Haiper AI support creators on a budget?',
                  back: 'Haiper provides daily renewable free generation credits, supporting text-to-video, image animation, and video repainting.',
                  hint: 'Daily credit system.',
                },
                {
                  front: 'What core architecture enables 2026 AI video tools to simulate realistic physical motion?',
                  back: 'Diffusion Transformers (DiTs) trained natively on spacetime latent tokens that capture optical flow, 3D physics, and continuous lighting.',
                  hint: 'DiT spacetime architectures.',
                },
                {
                  front: 'What is the recommended multi-tool workflow for creating professional watermark-free AI video?',
                  back: '1) Generate ultra-high resolution keyframes with Midjourney/Flux, 2) Animate via Kling AI or Luma Dream Machine, 3) Enhance motion using camera direction prompts.',
                  hint: 'Keyframe generation + motion synthesis.',
                },
              ],
            },
            modelUsed: 'Gemini 1.5 Pro',
            tokensConsumed: 1100,
            createdAt: '2026-10-27T10:07:00Z',
          },
          {
            id: 'art-yt-quiz',
            tenantId: 'tenant-acme',
            noteId: 'note-user-ai-video-tools',
            userId: 'user-alex',
            artifactType: 'quiz',
            title: 'AI Video Generation Practice Quiz',
            content: {
              quiz: {
                questions: [
                  {
                    id: 'qz-1',
                    question: 'Which AI video generator provides high-motion consistency, realistic physics, and watermark-free exports?',
                    options: [
                      'Kling AI & Luma Dream Machine',
                      'MS Paint 3D',
                      'Windows Media Player',
                      'QuickTime 7',
                    ],
                    correctOptionIndex: 0,
                    explanation: 'Kling AI and Luma Dream Machine are industry-leading generative video models providing high physical realism and watermark-free exports.',
                  },
                  {
                    id: 'qz-2',
                    question: 'What is the primary benefit of Image-to-Video generation over text-only prompting?',
                    options: [
                      'It produces lower quality clips',
                      'It anchors visual composition, lighting, and character identity from the initial keyframe',
                      'It eliminates the need for GPUs',
                      'It restricts outputs to 1 frame per second',
                    ],
                    correctOptionIndex: 1,
                    explanation: 'Conditioning on a source image locks the subject and background, avoiding hallucinated variations between frames.',
                  },
                  {
                    id: 'qz-3',
                    question: 'Which tool provides daily renewable free credits for image animation and video repainting?',
                    options: [
                      'Haiper AI',
                      'Adobe Flash Player',
                      'Notepad.exe',
                      'WinRAR',
                    ],
                    correctOptionIndex: 0,
                    explanation: 'Haiper AI offers daily free allowances for video generation, repainting, and image animation.',
                  },
                  {
                    id: 'qz-4',
                    question: 'What breakthrough architectural design powers 2026 generative video consistency?',
                    options: [
                      'Static single-frame JPEG interpolation',
                      'Spatiotemporal Diffusion Transformers (DiTs) modeling continuous 3D physics',
                      'Standard text regex replacement',
                      'Lossy MPEG-1 compression algorithms',
                    ],
                    correctOptionIndex: 1,
                    explanation: 'Video Diffusion Transformers operate on unified latent spacetime volumes to ensure natural motion dynamics and temporal coherence.',
                  },
                ],
              },
            },
            modelUsed: 'Gemini 1.5 Pro',
            tokensConsumed: 1350,
            createdAt: '2026-10-27T10:08:00Z',
          },
        ],
        createdAt: '2026-10-27T10:00:00Z',
        updatedAt: '2026-10-27T10:08:00Z',
      },
    ],
  },
  'tenant-globaltech': {
    tenant: {
      id: 'tenant-globaltech',
      name: 'GlobalTech Enterprise',
      slug: 'globaltech',
      tier: 'pro',
      createdAt: '2026-09-15T08:00:00Z',
    },
    user: {
      id: 'user-beth',
      tenantId: 'tenant-globaltech',
      email: 'beth.vance@globaltech.com',
      name: 'Beth Vance',
      role: 'owner',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    },
    subscription: {
      id: 'sub-globaltech',
      tenantId: 'tenant-globaltech',
      planTier: 'pro',
      status: 'active',
      trialStart: '2026-09-15T08:00:00Z',
      trialEnd: '2026-09-22T08:00:00Z',
      currentPeriodEnd: '2026-11-15T08:00:00Z',
      cancelAtPeriodEnd: false,
    },
    usage: {
      tenantId: 'tenant-globaltech',
      aiTokensConsumed: 482100,
      aiTokensLimit: 1000000,
      storageBytesConsumed: 8 * 1024 * 1024 * 1024,
      storageBytesLimit: 25 * 1024 * 1024 * 1024,
      notesCount: 42,
      notesLimit: -1,
      audioMinutesTranscribed: 145,
      audioMinutesLimit: 300,
    },
    folders: [
      { id: 'f-gt-1', tenantId: 'tenant-globaltech', userId: 'user-beth', name: 'Enterprise Architecture', color: '#8B5CF6', createdAt: '2026-09-15T09:00:00Z' },
      { id: 'f-gt-2', tenantId: 'tenant-globaltech', userId: 'user-beth', name: 'Security & Compliance', color: '#10B981', createdAt: '2026-09-16T10:00:00Z' },
    ],
    tags: [
      { id: 't-gt-1', tenantId: 'tenant-globaltech', name: 'SOC2', color: '#10B981' },
      { id: 't-gt-2', tenantId: 'tenant-globaltech', name: 'Vercel Deployment', color: '#06B6D4' },
    ],
    notes: [
      {
        id: 'note-gt-1',
        tenantId: 'tenant-globaltech',
        userId: 'user-beth',
        folderId: 'f-gt-2',
        title: 'GlobalTech SOC2 Type II Audit & Data Isolation Requirements',
        content: `### Security Invariants for External SaaS Solutions
All vendors processing GlobalTech audio, video, and internal documents must demonstrate:
1. Strict logical multi-tenant database isolation.
2. At-rest AES-256 and in-transit TLS 1.3 encryption.
3. Zero training on customer data by third-party LLMs.
4. Comprehensive audit trails for all administrative actions.`,
        isPinned: true,
        isArchived: false,
        tags: [
          { id: 't-gt-1', tenantId: 'tenant-globaltech', name: 'SOC2', color: '#10B981' },
        ],
        sources: [
          {
            id: 'src-gt-1',
            tenantId: 'tenant-globaltech',
            noteId: 'note-gt-1',
            sourceType: 'pdf',
            title: 'GlobalTech_Security_Requirements_2026.pdf',
            fileSizeBytes: 4800000,
            processingStatus: 'completed',
            createdAt: '2026-10-18T14:00:00Z',
          },
        ],
        aiArtifacts: [
          {
            id: 'art-gt-1',
            tenantId: 'tenant-globaltech',
            noteId: 'note-gt-1',
            userId: 'user-beth',
            artifactType: 'summary',
            title: 'Compliance Summary',
            content: {
              summaryText: 'GlobalTech mandates enterprise-grade tenant isolation with RLS and non-negotiable zero-data-retention guarantees from AI providers.',
              keyTakeaways: [
                'Tenant isolation must be verified at database query engine level.',
                'AI completions must not be logged or persisted by LLM vendors.',
              ],
            },
            modelUsed: 'GPT-4o Enterprise',
            tokensConsumed: 1200,
            createdAt: '2026-10-18T14:10:00Z',
          },
        ],
        createdAt: '2026-10-18T13:45:00Z',
        updatedAt: '2026-10-18T14:20:00Z',
      },
    ],
  },
  'tenant-solocreator': {
    tenant: {
      id: 'tenant-solocreator',
      name: 'Solo Creator Studio',
      slug: 'solo-studio',
      tier: 'trial',
      createdAt: '2026-10-10T10:00:00Z',
    },
    user: {
      id: 'user-david',
      tenantId: 'tenant-solocreator',
      email: 'david@creators.co',
      name: 'David Chen',
      role: 'owner',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    },
    subscription: {
      id: 'sub-solocreator',
      tenantId: 'tenant-solocreator',
      planTier: 'trial',
      status: 'trialing',
      trialStart: '2026-10-10T10:00:00Z',
      trialEnd: '2026-10-17T10:00:00Z', // Expired!
      cancelAtPeriodEnd: false,
    },
    usage: {
      tenantId: 'tenant-solocreator',
      aiTokensConsumed: 48900,
      aiTokensLimit: 50000,
      storageBytesConsumed: 180 * 1024 * 1024,
      storageBytesLimit: 250 * 1024 * 1024,
      notesCount: 8,
      notesLimit: 25,
      audioMinutesTranscribed: 28,
      audioMinutesLimit: 30,
    },
    folders: [],
    tags: [],
    notes: [
      {
        id: 'note-sc-1',
        tenantId: 'tenant-solocreator',
        userId: 'user-david',
        title: 'YouTube Creator Workflow — Video Research & Scripts',
        content: 'Notes on video pacing, retention hooks, and YouTube thumbnail strategies.',
        isPinned: false,
        isArchived: false,
        tags: [],
        sources: [],
        aiArtifacts: [],
        createdAt: '2026-10-15T12:00:00Z',
        updatedAt: '2026-10-15T12:00:00Z',
      },
    ],
  },
};

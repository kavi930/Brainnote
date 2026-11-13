// ==============================================================================
// Brainnote SaaS — AI Generation API Endpoint
// POST /api/ai
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateSummary, 
  generateStructuredNotes,
  generateConceptMap,
  generateMindMap,
  generateTimeline,
  generateCompareSources,
  generateGlossary,
  generateAudioOverview,
  generateMeetingMinutes, 
  generateActionItems, 
  generateFlashcards, 
  generateQuiz,
  generateInterviewQA,
  answerQuestionGrounded,
  assistWriting
} from '@/lib/ai-provider';
import { updateNoteArtifactAsync } from '@/lib/server-store';
import { AIArtifact, AIArtifactType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      noteId, 
      title, 
      content, 
      artifactType, 
      tenantId, 
      sourceTranscript, 
      question,
      splitOptions = true
    } = body;

    const effectiveTitle = title || 'Technical Knowledge Note';

    if (!noteId || !artifactType || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: noteId, artifactType, and tenantId are mandatory.' },
        { status: 400 }
      );
    }

    const createdArtifacts: AIArtifact[] = [];
    let primaryArtifact: AIArtifact | null = null;
    let tokensUsed = 0;
    const now = new Date().toISOString();
    const baseTimestamp = Date.now();

    // 1. EXECUTIVE SUMMARY & MULTI-OPTION NOTES (Requirement 3: Separate Document for Every Option)
    if (artifactType === 'summary') {
      const summaryRes = await generateSummary(effectiveTitle, content || '', sourceTranscript);
      tokensUsed += summaryRes.tokensUsed;

      // Document 1: Executive Summary
      const doc1: AIArtifact = {
        id: `art-${baseTimestamp}-summary`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'summary',
        title: `Executive Summary: ${effectiveTitle}`,
        content: {
          summaryText: summaryRes.result.summaryText,
        },
        modelUsed: summaryRes.modelUsed,
        tokensConsumed: summaryRes.tokensUsed,
        createdAt: new Date(baseTimestamp).toISOString(),
      };
      createdArtifacts.push(doc1);
      await updateNoteArtifactAsync(tenantId, noteId, doc1);

      // Document 2: Key Takeaways
      if (summaryRes.result.keyTakeaways && summaryRes.result.keyTakeaways.length > 0) {
        const doc2: AIArtifact = {
          id: `art-${baseTimestamp}-takeaways`,
          tenantId,
          noteId,
          userId: 'user-server-resolved',
          artifactType: 'key_takeaways',
          title: `Key Takeaways: ${effectiveTitle}`,
          content: {
            keyTakeaways: summaryRes.result.keyTakeaways,
          },
          modelUsed: summaryRes.modelUsed,
          tokensConsumed: 450,
          createdAt: new Date(baseTimestamp + 1000).toISOString(),
        };
        createdArtifacts.push(doc2);
        await updateNoteArtifactAsync(tenantId, noteId, doc2);
      }

      // Document 3: Structured Notes (Multi-option separate document)
      if (splitOptions) {
        const notesRes = await generateStructuredNotes(effectiveTitle, content || '');
        tokensUsed += notesRes.tokensUsed;

        const doc3: AIArtifact = {
          id: `art-${baseTimestamp}-notes`,
          tenantId,
          noteId,
          userId: 'user-server-resolved',
          artifactType: 'structured_notes',
          title: `Structured Notes: ${effectiveTitle}`,
          content: {
            summaryText: notesRes.result.summaryText,
            formattedMarkdown: notesRes.result.formattedMarkdown,
          },
          modelUsed: notesRes.modelUsed,
          tokensConsumed: notesRes.tokensUsed,
          createdAt: new Date(baseTimestamp + 2000).toISOString(),
        };
        createdArtifacts.push(doc3);
        await updateNoteArtifactAsync(tenantId, noteId, doc3);

        // Document 4: Action Items
        const actionsRes = await generateActionItems(effectiveTitle, content || '');
        tokensUsed += actionsRes.tokensUsed;

        const doc4: AIArtifact = {
          id: `art-${baseTimestamp}-actions`,
          tenantId,
          noteId,
          userId: 'user-server-resolved',
          artifactType: 'action_items',
          title: `Action Items: ${effectiveTitle}`,
          content: {
            actionItems: actionsRes.result.actionItems,
          },
          modelUsed: actionsRes.modelUsed,
          tokensConsumed: actionsRes.tokensUsed,
          createdAt: new Date(baseTimestamp + 3000).toISOString(),
        };
        createdArtifacts.push(doc4);
        await updateNoteArtifactAsync(tenantId, noteId, doc4);
      }

      primaryArtifact = doc1;
    }

    // 2. STRUCTURED NOTES (Dedicated)
    else if (artifactType === 'structured_notes') {
      const res = await generateStructuredNotes(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-notes`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'structured_notes',
        title: `Structured Notes: ${effectiveTitle}`,
        content: {
          summaryText: res.result.summaryText,
          formattedMarkdown: res.result.formattedMarkdown,
        },
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 3. KEY TAKEAWAYS (Dedicated)
    else if (artifactType === 'key_takeaways') {
      const summaryRes = await generateSummary(effectiveTitle, content || '', sourceTranscript);
      tokensUsed += summaryRes.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-takeaways`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'key_takeaways',
        title: `Key Takeaways: ${effectiveTitle}`,
        content: {
          keyTakeaways: summaryRes.result.keyTakeaways,
        },
        modelUsed: summaryRes.modelUsed,
        tokensConsumed: summaryRes.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 4. ACTION ITEMS (Dedicated)
    else if (artifactType === 'action_items') {
      const res = await generateActionItems(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-actions`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'action_items',
        title: `Action Items: ${effectiveTitle}`,
        content: {
          actionItems: res.result.actionItems,
        },
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 5. FLASHCARDS
    else if (artifactType === 'flashcards') {
      const res = await generateFlashcards(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-flashcards`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'flashcards',
        title: `Study Flashcards: ${effectiveTitle}`,
        content: {
          flashcards: res.result.flashcards,
        },
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 6. INTERACTIVE QUIZ
    else if (artifactType === 'quiz') {
      const res = await generateQuiz(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-quiz`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'quiz',
        title: `Interactive Study Quiz: ${effectiveTitle}`,
        content: {
          questions: res.result.questions,
          quiz: {
            questions: res.result.questions,
          },
        },
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 7. TECHNICAL INTERVIEW Q&A
    else if (artifactType === 'interview_qa') {
      const res = await generateInterviewQA(effectiveTitle, content || '', sourceTranscript);
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-interview`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'interview_qa',
        title: `Technical Interview Q&A: ${effectiveTitle}`,
        content: {
          questions: res.result.questions,
          interviewQA: {
            questions: res.result.questions,
          },
        },
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 8. MEETING MINUTES & DECISIONS (Splits into 3 documents)
    else if (artifactType === 'meeting_minutes' || artifactType === 'decisions') {
      const res = await generateMeetingMinutes(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      // Document 1: Meeting Minutes
      const doc1: AIArtifact = {
        id: `art-${baseTimestamp}-minutes`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'meeting_minutes',
        title: `Meeting Minutes: ${effectiveTitle}`,
        content: {
          meetingMinutes: {
            attendees: res.result.attendees,
            agenda: res.result.agenda,
            discussionPoints: res.result.discussionPoints,
            decisions: res.result.decisions,
          },
        },
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: new Date(baseTimestamp).toISOString(),
      };
      createdArtifacts.push(doc1);
      await updateNoteArtifactAsync(tenantId, noteId, doc1);

      // Document 2: Key Decisions Log
      if (res.result.decisions && res.result.decisions.length > 0) {
        const doc2: AIArtifact = {
          id: `art-${baseTimestamp}-decisions`,
          tenantId,
          noteId,
          userId: 'user-server-resolved',
          artifactType: 'decisions',
          title: `Key Decisions Log: ${effectiveTitle}`,
          content: {
            meetingMinutes: {
              decisions: res.result.decisions,
            },
          },
          modelUsed: res.modelUsed,
          tokensConsumed: 400,
          createdAt: new Date(baseTimestamp + 1000).toISOString(),
        };
        createdArtifacts.push(doc2);
        await updateNoteArtifactAsync(tenantId, noteId, doc2);
      }

      primaryArtifact = artifactType === 'decisions' && createdArtifacts[1] ? createdArtifacts[1] : doc1;
    }

    // 9. CONCEPT MAP
    else if (artifactType === 'concept_map') {
      const res = await generateConceptMap(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-conceptmap`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'concept_map',
        title: `Concept Map: ${effectiveTitle}`,
        content: res.result,
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 10. MIND MAP
    else if (artifactType === 'mind_map') {
      const res = await generateMindMap(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-mindmap`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'mind_map',
        title: `Mind Map Blueprint: ${effectiveTitle}`,
        content: res.result,
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 11. TIMELINE & MILESTONES
    else if (artifactType === 'timeline') {
      const res = await generateTimeline(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-timeline`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'timeline',
        title: `Timeline & Milestones: ${effectiveTitle}`,
        content: res.result,
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 12. COMPARE SOURCES
    else if (artifactType === 'compare_sources') {
      const res = await generateCompareSources(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-compare`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'compare_sources',
        title: `Source Comparison Matrix: ${effectiveTitle}`,
        content: res.result,
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 13. DOMAIN GLOSSARY
    else if (artifactType === 'glossary') {
      const res = await generateGlossary(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-glossary`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'glossary',
        title: `Domain Glossary: ${effectiveTitle}`,
        content: res.result,
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 14. AUDIO OVERVIEW
    else if (artifactType === 'audio_overview') {
      const res = await generateAudioOverview(effectiveTitle, content || '');
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-audio`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'audio_overview',
        title: `Audio Overview: ${effectiveTitle}`,
        content: res.result,
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 15. STUDY GUIDE & REVISION NOTES
    else if (artifactType === 'study_guide') {
      const glossaryRes = await generateGlossary(effectiveTitle, content || '');
      tokensUsed += glossaryRes.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-studyguide`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'study_guide',
        title: `Study Guide & Curriculum: ${effectiveTitle}`,
        content: {
          studyGuide: {
            topics: [
              {
                title: 'Core Fundamentals & Architecture',
                explanation: `Detailed conceptual breakdown of ${effectiveTitle}. Emphasizes deterministic invariants, source evidence grounding, and enterprise maintainability.`,
              },
              {
                title: 'Data Integrity & Boundary Enforcement',
                explanation: 'Analysis of zero-trust isolation policies, transactional state synchronization, and audit logging across distributed workers.',
              },
              {
                title: 'Active Recall Application',
                explanation: 'Strategies for reinforcing retention using spaced repetition flashcards, practice quizzes, and real-world evaluation benchmarks.',
              },
            ],
            glossary: glossaryRes.result.studyGuide.glossary,
          },
        },
        modelUsed: 'gemini-1.5-pro',
        tokensConsumed: 1400,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 16. Q&A
    else if (artifactType === 'qa') {
      const query = question || 'What are the essential concepts and takeaways?';
      const res = await answerQuestionGrounded(query, effectiveTitle, content || '', sourceTranscript);
      tokensUsed += res.tokensUsed;

      primaryArtifact = {
        id: `art-${baseTimestamp}-qa`,
        tenantId,
        noteId,
        userId: 'user-server-resolved',
        artifactType: 'qa',
        title: `FAQs: ${effectiveTitle}`,
        content: {
          summaryText: res.result.answer,
          qaAnswers: [
            {
              question: query,
              answer: res.result.answer,
              citations: res.result.citations,
            },
          ],
        },
        modelUsed: res.modelUsed,
        tokensConsumed: res.tokensUsed,
        createdAt: now,
      };
      createdArtifacts.push(primaryArtifact);
      await updateNoteArtifactAsync(tenantId, noteId, primaryArtifact);
    }

    // 17. WRITING ASSISTANT
    else if (artifactType === 'writing_assist') {
      const action = (body.writingAction || 'improve') as 'improve' | 'grammar' | 'expand' | 'key_points' | 'summarize' | 'faq';
      const res = await assistWriting(action, content || '', effectiveTitle);
      return NextResponse.json({
        success: true,
        action,
        result: res.result,
        tokensUsed: res.tokensUsed,
        modelUsed: res.modelUsed,
      });
    }

    // Unsupported fallback
    else {
      return NextResponse.json(
        { error: `Unsupported artifact type: ${artifactType}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      artifact: primaryArtifact,
      artifacts: createdArtifacts,
      tokensUsed,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('[API /api/ai Error]', error.message, error.stack);
    return NextResponse.json(
      { error: error.message || 'Internal AI generation error' },
      { status: 500 }
    );
  }
}

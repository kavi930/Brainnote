// ==============================================================================
// Brainnote SaaS — AI Generation API Endpoint
// POST /api/ai
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateSummary, 
  generateMeetingMinutes, 
  generateActionItems, 
  generateFlashcards, 
  generateQuiz,
  generateInterviewQA,
  answerQuestionGrounded 
} from '@/lib/ai-provider';
import { updateNoteArtifact } from '@/lib/server-store';
import { AIArtifactType } from '@/types';

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
      question 
    } = body;

    const effectiveTitle = title || 'Technical Knowledge Note';

    if (!noteId || !artifactType || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required fields: noteId, artifactType, and tenantId are mandatory.' },
        { status: 400 }
      );
    }

    let artifactTitle = 'AI Artifact';
    let artifactContent: Record<string, unknown> = {};
    let tokensUsed = 0;
    let modelUsed = 'gemini-1.5-pro';

    switch (artifactType as AIArtifactType) {
      case 'summary': {
        const res = await generateSummary(effectiveTitle, content || '', sourceTranscript);
        artifactTitle = 'Executive Summary';
        artifactContent = res.result as unknown as Record<string, unknown>;
        tokensUsed = res.tokensUsed;
        modelUsed = res.modelUsed;
        break;
      }

      case 'meeting_minutes': {
        const res = await generateMeetingMinutes(effectiveTitle, content || '');
        artifactTitle = 'Meeting Minutes & Decisions';
        artifactContent = res.result as unknown as Record<string, unknown>;
        tokensUsed = res.tokensUsed;
        modelUsed = res.modelUsed;
        break;
      }

      case 'action_items': {
        const res = await generateActionItems(effectiveTitle, content || '');
        artifactTitle = 'Action Items Checklist';
        artifactContent = {
          actionItems: res.result.actionItems,
        };
        tokensUsed = res.tokensUsed;
        modelUsed = res.modelUsed;
        break;
      }

      case 'flashcards': {
        const res = await generateFlashcards(effectiveTitle, content || '');
        artifactTitle = 'Study Flashcards';
        artifactContent = {
          flashcards: res.result.flashcards,
        };
        tokensUsed = res.tokensUsed;
        modelUsed = res.modelUsed;
        break;
      }

      case 'quiz': {
        const res = await generateQuiz(effectiveTitle, content || '');
        artifactTitle = 'Interactive Study Quiz';
        artifactContent = {
          questions: res.result.questions,
          quiz: {
            questions: res.result.questions,
          },
        };
        tokensUsed = res.tokensUsed;
        modelUsed = res.modelUsed;
        break;
      }

      case 'qa': {
        if (!question) {
          return NextResponse.json({ error: 'Question is required for Q&A artifact.' }, { status: 400 });
        }
        const res = await answerQuestionGrounded(question, effectiveTitle, content || '', sourceTranscript);
        artifactTitle = `Q&A: ${question.slice(0, 30)}...`;
        artifactContent = res.result as unknown as Record<string, unknown>;
        tokensUsed = res.tokensUsed;
        modelUsed = res.modelUsed;
        break;
      }

      case 'interview_qa': {
        const res = await generateInterviewQA(effectiveTitle, content || '', sourceTranscript);
        artifactTitle = 'Interview Ready Questions & Answers';
        artifactContent = {
          questions: res.result.questions,
          interviewQA: {
            questions: res.result.questions,
          },
        };
        tokensUsed = res.tokensUsed;
        modelUsed = res.modelUsed;
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unsupported artifact type: ${artifactType}` },
          { status: 400 }
        );
    }

    const artifact = {
      id: `art-${Date.now()}`,
      tenantId,
      noteId,
      userId: 'user-server-resolved',
      artifactType,
      title: artifactTitle,
      content: artifactContent,
      modelUsed,
      tokensConsumed: tokensUsed,
      createdAt: new Date().toISOString(),
    };

    updateNoteArtifact(tenantId, noteId, artifact as any);

    return NextResponse.json({
      success: true,
      artifact,
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

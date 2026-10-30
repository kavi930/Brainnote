// ==============================================================================
// Brainnote SaaS — Automated Tests for Phase 2: AI Pipelines & Webhook Security
// ==============================================================================

import { describe, it, expect } from 'vitest';
import { 
  generateSummary, 
  generateMeetingMinutes, 
  generateActionItems, 
  generateFlashcards,
  generateInterviewQA 
} from '../src/lib/ai-provider';

describe('Phase 2 AI Generation Pipelines', () => {
  const sampleTitle = 'Autonomous AI Agents & Enterprise Architecture (2026)';
  const sampleContent = `The 2026 keynote centered on reasoning models and persistent memory layers.
Multi-agent orchestration patterns outperform single monolith prompts by 34%.
For SaaS platforms, strict multi-tenant database isolation is non-negotiable.`;

  it('generates an executive summary with key takeaways', async () => {
    const res = await generateSummary(sampleTitle, sampleContent);
    expect(res.result).toBeDefined();
    expect(res.result.summaryText).toContain('Autonomous AI Agents');
    expect(res.result.keyTakeaways.length).toBeGreaterThanOrEqual(2);
    expect(res.tokensUsed).toBeGreaterThan(0);
  });

  it('generates structured meeting minutes with attendees and decisions', async () => {
    const res = await generateMeetingMinutes(sampleTitle, sampleContent);
    expect(res.result.attendees).toBeDefined();
    expect(res.result.attendees.length).toBeGreaterThan(0);
    expect(res.result.decisions.length).toBeGreaterThan(0);
    expect(res.tokensUsed).toBeGreaterThan(0);
  });

  it('extracts action items with tasks and completion status', async () => {
    const res = await generateActionItems(sampleTitle, sampleContent);
    expect(res.result.actionItems).toBeDefined();
    expect(res.result.actionItems.length).toBeGreaterThanOrEqual(2);
    expect(res.result.actionItems[0]).toHaveProperty('task');
    expect(res.result.actionItems[0]).toHaveProperty('completed');
  });

  it('generates active recall study flashcards with front, back, and hints', async () => {
    const res = await generateFlashcards(sampleTitle, sampleContent);
    expect(res.result.flashcards).toBeDefined();
    expect(res.result.flashcards.length).toBeGreaterThanOrEqual(2);
    expect(res.result.flashcards[0]).toHaveProperty('front');
    expect(res.result.flashcards[0]).toHaveProperty('back');
  });

  it('generates technical interview questions with model answers, rubrics, and code patterns', async () => {
    const res = await generateInterviewQA(
      'Building a Custom LLM Evaluation Harness in Python from Scratch',
      'The 4 modular components include Dataset Manager, Model Interface, Metrics Pipeline, and Results Logger.'
    );
    expect(res.result.questions).toBeDefined();
    expect(res.result.questions.length).toBeGreaterThanOrEqual(3);
    const firstQ = res.result.questions[0];
    expect(firstQ).toHaveProperty('question');
    expect(firstQ).toHaveProperty('answer');
    expect(firstQ).toHaveProperty('keyCriteria');
    expect(firstQ.keyCriteria.length).toBeGreaterThan(0);
    expect(firstQ).toHaveProperty('difficulty');
    expect(['Junior', 'Mid-Level', 'Senior', 'Staff/Principal']).toContain(firstQ.difficulty);
    expect(res.tokensUsed).toBeGreaterThan(0);
  });
});

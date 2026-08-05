import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAgent } from '../lib/agentRegistry.mjs';

test('resolveAgent returns the ChatGPT preset', () => {
  const agent = resolveAgent('ChatGpt');

  assert.equal(agent.id, 'chatgpt');
  assert.equal(agent.defaultModel, 'gpt-4o-mini');
  assert.match(agent.description, /interview/i);
});

test('resolveAgent merges custom instructions into the prompt', () => {
  const agent = resolveAgent('ChatGpt', {
    customInstructions: 'Be concise and practical.'
  });

  assert.match(agent.systemPrompt, /Be concise and practical\./);
  assert.match(agent.systemPrompt, /You are ChatGPT/i);
});

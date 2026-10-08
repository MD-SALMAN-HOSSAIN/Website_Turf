#!/usr/bin/env node

const DEFAULT_PROMPT = 'Create a concise kickoff plan for this project and identify the first implementation steps.';

class TaskAgent {
  constructor(name) {
    this.name = name;
    this.systemPrompt = `You are ${name}, a practical planning agent. Break work into clear steps, prioritize outcomes, and keep execution focused.`;
  }

  plan(prompt) {
    const cleanedPrompt = prompt.trim() || DEFAULT_PROMPT;
    const topic = cleanedPrompt.toLowerCase();

    const actions = [
      'Clarify the objective and constraints.',
      'Map the required files, tools, and dependencies.',
      'Draft an execution plan with milestones.',
      'Validate the result and note risks or follow-ups.'
    ];

    const focus = topic.includes('website')
      ? 'Website and frontend delivery'
      : topic.includes('data')
        ? 'Data and analytics workflow'
        : topic.includes('api')
          ? 'API and integration workflow'
          : 'General product execution workflow';

    return {
      agent: this.name,
      systemPrompt: this.systemPrompt,
      focus,
      originalPrompt: cleanedPrompt,
      steps: actions,
      summary: `The next step is to turn the request into a small, testable plan and validate it before scaling further.`
    };
  }
}

function main() {
  const prompt = process.argv.slice(2).join(' ') || DEFAULT_PROMPT;
  const agent = new TaskAgent('Website Turf Agent');
  const result = agent.plan(prompt);

  console.log(JSON.stringify(result, null, 2));
}

main();

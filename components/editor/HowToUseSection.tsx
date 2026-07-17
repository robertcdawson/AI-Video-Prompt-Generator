const STEPS: Array<{ title: string; body: string }> = [
  {
    title: "Describe your video idea",
    body:
      "Enter the story, concept, dialogue, mood, or visual direction you have in mind. It can be rough—the app will organize it into a production draft.",
  },
  {
    title: "Review the generated project",
    body:
      "Check the suggested film bible, characters, locations, scenes, and visual rules. Edit anything that does not match your intent, then approve the decisions you want to keep.",
  },
  {
    title: "Refine the shots",
    body:
      "Review each shot’s purpose, action, blocking, camera choices, continuity notes, first-frame prompt, and video prompt. Add or revise references where needed.",
  },
  {
    title: "Copy the prompts in order",
    body:
      "Open Exports and copy Step 1, Step 2, and Step 3 into your video agent in that order. The first sets up the agent, the second supplies project context, and the third provides the individual shots.",
  },
  {
    title: "Generate one shot at a time",
    body:
      "Ask the video agent to prepare the next shot and restate its understanding. Review the proposed shot before approving generation so continuity problems are easier to catch.",
  },
  {
    title: "Save your project",
    body:
      "Your work autosaves in this browser. Download the project file (.json) to create a portable backup or continue on another device. Download the Markdown shot table when you need a readable version to share.",
  },
];

/**
 * Static usage guide shown after the Exports section. Step numbers live in the
 * text content (not CSS markers) because Tailwind's preflight strips <ol>
 * markers — the <ol> still carries the list semantics.
 */
export function HowToUseSection() {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="px-5 py-4">
        <h2 className="text-lg font-semibold text-zinc-900">How to use this app</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Turn a rough idea into a reviewed project plan, then use the exported prompts with your AI video
          agent.
        </p>
        <ol className="mt-4 flex max-w-prose flex-col gap-4">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <h3 className="text-sm font-semibold text-zinc-800">
                {i + 1}. {step.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-500">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

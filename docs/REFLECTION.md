# Reflection

## What was hardest and why

The hardest part was turning a working study app into something I could confidently ship. Adding AI features was only one part of the work: I also had to think about unreliable model responses, API errors, keyboard and screen-reader access, testing, and deployment. Making quiz and flashcard output predictable was especially important because model-generated content cannot be assumed to be valid. I learned that production readiness comes from handling the unhappy paths as carefully as the successful ones.

## What I would do differently

I would define the evidence and acceptance criteria earlier, then work through them in smaller checkpoints. I would also run accessibility and performance audits earlier, while the interface was still changing, and keep a clear record of which results came from local testing versus the live deployment. For the difficulty experiment, I would collect real quiz outputs and participant ratings before drawing conclusions instead of relying on illustrative examples.

## One thing that surprised me

I was surprised by how much confidence comes from small, repeatable checks. Unit coverage was useful, but the browser tests also caught important user-facing behavior: retrying after a rate limit, revealing quiz reasoning, and returning keyboard focus after closing a dialog. I also saw that a single Lighthouse performance score can vary between runs, so I should report the conditions and results honestly rather than treating one score as definitive.

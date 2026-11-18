# AI-Assistance Disclosure — Briqen Creator Studio

## Overview

AI (Claude, Anthropic) was used extensively in developing this submission. This appendix discloses the relevant prompts, AI contributions, and what remains for the applicant to personally verify.

## Task-Related Prompts

### Prompt 1 (Initial)
> "Help me make the best assignment possible... I want a clear end-to-end workflow... the best user interface and experience... premium... curved backgrounds, like Apple. Take some good references... evaluate [the] ideas."

### Prompt 2 (Implementation)
> "You are my principal product engineer... Transform this into an exceptional, fully functional, visually premium, submission-ready product engineering assignment."

## AI Contributions

AI assisted with the following:
- Product/UX ideation and workflow design
- Comparison of public references (Descript, Runway, Canva, Apple HIG)
- React + TypeScript component architecture and state management design
- HTML interaction prototype (original version)
- Zustand store implementation with invariant enforcement
- CSS design system with Apple-inspired aesthetics
- Unit test suite (72 tests covering all acceptance criteria)
- PDF layout and content structure
- This documentation

## What AI Did NOT Do

- AI did not access any real AI generation APIs or produce real video content
- AI did not conduct user testing with real participants
- AI did not deploy the application to production
- All generation and export functionality is explicitly simulated

## Applicant Verification

I wrote the original brief, defined the critical scenario and priorities, and chose the design direction (Apple-inspired, script-first scene cards over timeline). I designed the state architecture: separating persistent scene edits from async generation jobs, revision-based staleness, and derived export gate. I reviewed and modified the generated code, ran the full app in-browser on desktop and mobile, walked through fail/retry/approve/export flows, ran all 72 unit and 9 e2e tests, inspected both PDFs for completeness and accuracy, and made final editorial and architecture decisions throughout.

## Public Design References

- Descript: descript.com/storyboard (storyboard-based editing)
- Runway: help.runwayml.com (AI generation workflows)
- Apple Human Interface Guidelines: developer.apple.com/design/human-interface-guidelines
- Briqen MI: apps.apple.com/app/id6834710907

## Prior Work Reference

- **Reticle** (open-source): Contributions to reticlehq/reticle — 8 merged pull requests including daemon lifecycle testing, injectable seams patterns, and state management improvements. Public at github.com/DevChiniwala/reticle
- **Private AI tooling**: Production AI tutoring platform involving Next.js dashboard, AI service integration, and state management. No confidential code or customer details shared.

**Prototype note:** All interaction states are simulated. No real AI generation or MP4 export occurs in this prototype.

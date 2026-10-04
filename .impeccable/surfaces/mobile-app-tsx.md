---
version: 1
slug: "mobile-app-tsx"
primary_target: "mobile/App.tsx"
related_targets: ["mobile/src"]
---

## Scope and mode
Nova phone app (Expo, iOS + Android), all screens. Mode: Operate.

## Audience and task
Nurses and doctors at the bedside. Photograph a newborn, add minimal details, get a screening result with next steps in under a minute, and find earlier screenings later. Fully offline: the model runs on the phone and photos never leave it.

## Structure (rolled, seed be2a0ead, own list position 4; approved by the user)
Worklist-first. Tab 1 "Screenings": today's babies, high-risk and borderline pinned as "Needs follow-up", earlier days below, searchable. "New screening" is a primary action (not a tab), opening a full-screen flow: photo, details, result, then back to the list with the new baby on top. Tab 2 "Model": measured accuracy, photo tips, limitations.

## Visual world
Inherits the web portal's canon (PRODUCT.md brand commitment): Nova teal tint, slate neutrals, calm clinical cards and lists, risk shown as icon plus word. Native conventions win on structure: system fonts, platform navigation and controls, safe areas, system Back, 44 pt / 48 dp targets, light and dark as first-class.

## Memorable moment
The result arriving in the flow: status, likelihood against the cut-off, and the next step, readable at arm's length.

## Unresolved
Icon source per platform (expo-symbols vs @expo/vector-icons on Android). iOS cannot be run locally until an iOS Simulator runtime is installed.

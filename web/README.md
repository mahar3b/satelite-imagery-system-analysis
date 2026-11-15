# F26-06 site

Public page for the cross-sensor land-cover project. Vite and React. Static build, no server.

## Run locally

From the repository root:

```bash
npm install --prefix web
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173.

## Deploy on Vercel

Import this GitHub repository and leave the project root as the repository root. `vercel.json` installs `web/`, builds it, and publishes `web/dist`.

If you would rather set the Vercel root directory to `web`, that folder has its own `vercel.json` and works on its own.

From the `web` folder, `npx vercel` does the same thing after you log in.

## Build phases

1. **Done.** Shell, problem, method, results table, timeline, Vercel config.
2. **Done.** Dark research-paper theme, tested-λ explorer, SVG sweep charts,
   exported paper figures, confusion analysis, and class-support fairness view.
   The class-wise Phase 4 evaluation snapshot is shown only for its saved
   λ = 0 and λ = 0.1 runs; it is separate from the reported Phase 3 sweep
   summary, and other class-wise λ values are not interpolated.
3. **Done.** Notebook pipeline walkthrough with code and tensor shapes,
   plus a collapsible viva-preparation section for domain shift, λ selection,
   sensor resolution, and model limitations.

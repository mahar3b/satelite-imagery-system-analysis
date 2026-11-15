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
2. **Next.** Lambda explorer, sweep charts, paper figures, error clusters, fairness.
3. **After that.** Viva questions, notebook walkthrough, final pass.

Say when to start phase 2. It should stay a separate session so the build is not cut off halfway.

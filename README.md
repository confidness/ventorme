# ventorme (local analysis copy)

Tools that make a local, offline copy of [ventorme.ai](https://ventorme.ai) for the HACKNEXT × Ventorme case (team 069), so the team can study the homepage and sign-up funnel without touching the live site. Not affiliated with Ventorme.

```bash
node mirror.mjs          # downloads the pages and every asset they use into ./site (about 90 MB, Node 18+)
node serve.mjs 8080      # serves the copy at http://localhost:8080
```

- `mirror.mjs` saves the homepage, `/register`, `/login`, the audience pages, `/about`, `/blog` and the legal pages, then follows every file they reference (scripts, styles, fonts, images, videos).
- Yandex Metrica and the Facebook pixel are rewritten to dead hosts, and `serve.mjs` answers `/api/*` like the real site does for a logged-out visitor, with Ventorme's session recorder switched off. Browsing the copy sends nothing to Ventorme's analytics.
- Sign-up and Google sign-in don't work in the copy. Use the real site for anything account-related.
- `site/` is not in this repo: it is Ventorme's own code, images, videos and content. Generate it locally and keep it local; don't deploy it.

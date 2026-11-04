# SkillGap AI Showcase Website

A responsive, static project showcase for the SkillGap AI Salesforce project. It uses HTML, CSS and JavaScript only; the sample calculator runs in the browser and does not connect to Salesforce or any backend.

## Preview locally

Open `index.html` directly in a modern browser, or serve this folder with a local static server from the repository root:

```bash
python -m http.server 8000 --directory website
```

Then visit [http://localhost:8000](http://localhost:8000). No dependencies, external assets or build step are needed.

## Publish with GitHub Pages

The repository includes a GitHub Actions workflow that publishes only this `website/` directory. To enable it:

1. Push the repository to GitHub.
2. Open **Settings → Pages** for the repository.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. On the repository's **Actions** tab, allow workflows if GitHub asks.
5. Push to `main` (or run the **Deploy SkillGap AI website** workflow from the Actions tab). The workflow uploads `website/` and deploys it to GitHub Pages.
6. When the deployment completes, GitHub displays the published URL in **Settings → Pages** and in the workflow run.

The workflow does not change repository settings or publish the Salesforce application files. The website is independent of a live Salesforce org.

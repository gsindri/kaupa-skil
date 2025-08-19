# Deployment

To prevent 404 errors on refresh or deep links, configure your hosting provider to rewrite all requests to `index.html`.

## Netlify
Add a `_redirects` file with the following rule:

```
/* /index.html 200
```

This repository includes this file in `public/_redirects`.

## Vercel
Add a `vercel.json` with a rewrite:

```
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Nginx or Cloudflare
Configure a catch-all rewrite to serve `index.html` for unknown paths.

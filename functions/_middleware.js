export async function onRequest({ request, next }) {
  const url = new URL(request.url);

  if (url.hostname === 'analyze-dega.pages.dev') {
    const newUrl = new URL(request.url);
    newUrl.hostname = 'taloninsight.com';
    return Response.redirect(newUrl.toString(), 301);
  }

  return next();
}

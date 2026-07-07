// CloudFront Function (viewer-request) associated with the "/api/*" cache
// behavior. The frontend calls relative "/api/..." paths so no backend URL
// is ever hardcoded per environment; this strips that "/api" prefix before
// the request reaches the API Gateway origin, whose real resources are
// "/auth", "/users", "/posts", "/groups", "/tasks" (no "/api" prefix).
function handler(event) {
    var request = event.request;
    request.uri = request.uri.replace(/^\/api(?=\/|$)/, '') || '/';
    return request;
}

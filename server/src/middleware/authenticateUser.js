// placeholder file for user authentication.
// This middleware currently allows all requests and attaches a fake user.
// replace with real authentication logic

export default function authenticateUser(req, res, next) {
  req.user = { user_id: 1 };
  next();
}

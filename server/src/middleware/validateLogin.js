// placeholder file for user validation.
// This middleware currently allows all requests and attaches a fake user.
// replace with real user validation logic

export default function validateLogin(req, res, next) {
  req.user = { user_id: 1 };
  next();
}
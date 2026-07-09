const { validationResult } = require('express-validator')

// Run after express-validator check()/body() chains. Collects all errors and
// returns a single 400 with a flat list, rather than failing on the first one.
function validate(req, res, next) {
  const errors = validationResult(req)
  if (errors.isEmpty()) return next()
  res.status(400).json({
    message: errors.array()[0].msg,
    errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
  })
}

module.exports = { validate }

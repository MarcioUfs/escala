function validateEmail(req, res) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.body.email)) {
    res.status(403).json({ msg: "Email inválido!" });
    return false;
  }
  return true;
}

module.exports = validateEmail;
function validateFields(req, res, requiredFields) {
  for (const field of requiredFields) {
    const value = req.body[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      res.status(403).json({ msg: `O campo '${field}' é obrigatório!` });
      return false;
    }
  }
  return true;
}

module.exports = validateFields;

function extrairDataString(fullTimestamp) {
  if (!fullTimestamp) return null;
  return fullTimestamp.toString().substring(0, 10);
}
module.exports = extrairDataString;
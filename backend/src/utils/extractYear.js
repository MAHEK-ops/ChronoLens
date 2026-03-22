function extractYear(text) {
  if (!text) return null;
  const match = text.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  return match ? parseInt(match[1]) : null;
}

module.exports = extractYear;

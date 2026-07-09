const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')           // Remove non-word chars
    .replace(/[\s_-]+/g, '-')           // Replace spaces/underscores with -
    .replace(/^-+|-+$/g, '');           // Remove leading/trailing -
}

module.exports = { slugify }
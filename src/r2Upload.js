// src/r2Upload.js
module.exports = async (file) => {
  // TODO: wire real R2 upload
  console.log("R2 stub hit – returning dummy URL");
  return file ? `https://dummy.url/${file.originalname}` : null;
};
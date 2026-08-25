const argon2 = require('argon2');
const crypto = require('crypto');

const hashPassword = async (password) => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
};

const comparePassword = async (password, hash) => {
  return argon2.verify(hash, password);
};

const generateSecureToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const createHmacSha256 = (data, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
};

const timingSafeEqual = (a, b) => {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateSecureToken,
  createHmacSha256,
  timingSafeEqual,
};

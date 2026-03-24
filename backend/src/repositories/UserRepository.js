const prisma = require('../db/prisma');

// ─── UserRepository ─────────────────────────────────────────────
// DB access layer for AppUser records — lookup and creation.

class UserRepository {
  /**
   * Find a user by their primary key.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.appUser.findUnique({
      where: { id },
    });
  }

  /**
   * Find a user by their email address.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    return prisma.appUser.findUnique({
      where: { email },
    });
  }

  /**
   * Create a new user record.
   * @param {string} username
   * @param {string} email
   * @param {string} passwordHash - Pre-hashed password
   * @returns {Promise<Object>} The created user record
   */
  async create(username, email, passwordHash) {
    return prisma.appUser.create({
      data: {
        username,
        email,
        passwordHash,
      },
    });
  }
}

module.exports = new UserRepository();

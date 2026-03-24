const prisma = require('../db/prisma');

// ─── BookmarkRepository ─────────────────────────────────────────
// DB access layer for Bookmark records — CRUD with ownership
// verification and duplicate prevention.

class BookmarkRepository {
  /**
   * Create a new bookmark for a user + location pair.
   * @param {number} userId
   * @param {number} locationId
   * @param {string|null} label - Optional user-defined label
   * @returns {Promise<Object>} The created bookmark record
   */
  async save(userId, locationId, label = null) {
    return prisma.bookmark.create({
      data: {
        userId,
        locationId,
        label: label || null,
      },
    });
  }

  /**
   * Retrieve all bookmarks belonging to a user, including
   * the full related Location data for each bookmark.
   * @param {number} userId
   * @returns {Promise<Object[]>}
   */
  async findByUserId(userId) {
    return prisma.bookmark.findMany({
      where: { userId },
      include: { location: true },
      orderBy: { savedAt: 'desc' },
    });
  }

  /**
   * Delete a bookmark only if the requesting user owns it.
   * Returns false instead of throwing when ownership check fails
   * or the bookmark does not exist.
   * @param {number} bookmarkId
   * @param {number} userId - Must match the bookmark's owner
   * @returns {Promise<boolean>} true if deleted, false otherwise
   */
  async delete(bookmarkId, userId) {
    // Verify ownership before deletion
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark || bookmark.userId !== userId) {
      return false;
    }

    await prisma.bookmark.delete({
      where: { id: bookmarkId },
    });

    return true;
  }

  /**
   * Check whether a bookmark already exists for a given
   * user + location combination. Used to prevent duplicates.
   * @param {number} userId
   * @param {number} locationId
   * @returns {Promise<boolean>}
   */
  async exists(userId, locationId) {
    const count = await prisma.bookmark.count({
      where: { userId, locationId },
    });

    return count > 0;
  }
}

module.exports = new BookmarkRepository();

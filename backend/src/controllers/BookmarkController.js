const BookmarkRepository = require('../repositories/BookmarkRepository');
const LocationRepository = require('../repositories/LocationRepository');
const AppError = require('../utils/AppError');

// ─── BookmarkController ─────────────────────────────────────────
// Handles save, retrieve, and delete operations for user bookmarks.

class BookmarkController {
  /**
   * POST /api/bookmarks
   * Save a new bookmark for a user + location pair.
   *
   * Request body: { userId, locationId, label? }
   * - 409 if bookmark already exists for this user + location
   * - label defaults to location.placeName if not provided
   *
   * Response: 201 { success, bookmark }
   */
  async save(req, res, next) {
    try {
      const { userId, locationId, label } = req.body;

      // ── Validate required fields ──
      if (!userId || !locationId) {
        throw new AppError('"userId" and "locationId" are required.', 400);
      }

      const parsedUserId = parseInt(userId, 10);
      const parsedLocationId = parseInt(locationId, 10);

      if (isNaN(parsedUserId) || parsedUserId <= 0 || isNaN(parsedLocationId) || parsedLocationId <= 0) {
        throw new AppError('"userId" and "locationId" must be positive integers.', 400);
      }

      // ── Check for duplicate bookmark ──
      const alreadyExists = await BookmarkRepository.exists(parsedUserId, parsedLocationId);
      if (alreadyExists) {
        throw new AppError('Bookmark already exists for this user and location.', 409);
      }

      // ── Resolve default label from location if not provided ──
      let resolvedLabel = label || null;
      if (!resolvedLabel) {
        const location = await LocationRepository.findById(parsedLocationId);
        if (location) {
          resolvedLabel = location.placeName || location.address || null;
        }
      }

      // ── Persist bookmark ──
      const bookmark = await BookmarkRepository.save(parsedUserId, parsedLocationId, resolvedLabel);

      return res.status(201).json({
        success: true,
        bookmark,
      });

    } catch (err) {
      if (err instanceof AppError) return next(err);
      console.error('🔴 BookmarkController.save unexpected error:', err);
      return next(new AppError('An unexpected error occurred while saving the bookmark.', 500));
    }
  }

  /**
   * GET /api/bookmarks/:userId
   * Retrieve all bookmarks for a user, including full location data.
   *
   * Response: { success, count, bookmarks }
   */
  async getByUserId(req, res, next) {
    try {
      const { userId } = req.params;
      const parsedUserId = parseInt(userId, 10);

      if (isNaN(parsedUserId) || parsedUserId <= 0) {
        throw new AppError('"userId" must be a positive integer.', 400);
      }

      const bookmarks = await BookmarkRepository.findByUserId(parsedUserId);

      return res.status(200).json({
        success: true,
        count: bookmarks.length,
        bookmarks,
      });

    } catch (err) {
      if (err instanceof AppError) return next(err);
      console.error('🔴 BookmarkController.getByUserId unexpected error:', err);
      return next(new AppError('An unexpected error occurred while fetching bookmarks.', 500));
    }
  }

  /**
   * DELETE /api/bookmarks/:id
   * Delete a bookmark by ID, verifying ownership via userId in the body.
   *
   * Request body: { userId }
   * - 403 if userId does not match the bookmark owner
   *
   * Response: { success, message }
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const parsedId = parseInt(id, 10);
      const parsedUserId = parseInt(userId, 10);

      if (isNaN(parsedId) || parsedId <= 0) {
        throw new AppError('Bookmark "id" must be a positive integer.', 400);
      }

      if (!userId || isNaN(parsedUserId) || parsedUserId <= 0) {
        throw new AppError('"userId" is required in the request body and must be a positive integer.', 400);
      }

      // ── Ownership-verified delete (returns false if not owner or not found) ──
      const deleted = await BookmarkRepository.delete(parsedId, parsedUserId);

      if (!deleted) {
        throw new AppError('Forbidden: bookmark not found or does not belong to this user.', 403);
      }

      return res.status(200).json({
        success: true,
        message: 'Bookmark deleted successfully.',
      });

    } catch (err) {
      if (err instanceof AppError) return next(err);
      console.error('🔴 BookmarkController.delete unexpected error:', err);
      return next(new AppError('An unexpected error occurred while deleting the bookmark.', 500));
    }
  }
}

module.exports = new BookmarkController();

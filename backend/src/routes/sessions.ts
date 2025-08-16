import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { runQuery, getQuery, allQuery } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /
router.get('/', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const sessions = await allQuery(
      `SELECT id, title, created_at, updated_at, message_count 
       FROM chat_sessions 
       WHERE user_id = ? 
       ORDER BY updated_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: sessions
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// GET /:sessionId
router.get('/:sessionId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;

    const session = await getQuery(
      `SELECT id, title, created_at, updated_at, message_count 
       FROM chat_sessions 
       WHERE id = ? AND user_id = ?`,
      [sessionId, userId]
    );

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    res.json({
      success: true,
      data: session
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// POST /
router.post('/', authenticateToken, [
  body('title').isString().trim().isLength({ min: 1, max: 100 })
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { title } = req.body;
    const userId = (req as any).user.id;
    const sessionId = uuidv4();

    await runQuery(
      'INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)',
      [sessionId, userId, title]
    );

    const session = await getQuery(
      'SELECT id, title, created_at, updated_at, message_count FROM chat_sessions WHERE id = ?',
      [sessionId]
    );

    res.status(201).json({
      success: true,
      data: session
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// PUT /:sessionId
router.put('/:sessionId', authenticateToken, [
  body('title').isString().trim().isLength({ min: 1, max: 100 })
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { sessionId } = req.params;
    const { title } = req.body;
    const userId = (req as any).user.id;

    // Verify session belongs to user
    const session = await getQuery(
      'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    await runQuery(
      'UPDATE chat_sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, sessionId]
    );

    const updatedSession = await getQuery(
      'SELECT id, title, created_at, updated_at, message_count FROM chat_sessions WHERE id = ?',
      [sessionId]
    );

    res.json({
      success: true,
      data: updatedSession
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// DELETE /:sessionId
router.delete('/:sessionId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;

    // Verify session belongs to user
    const session = await getQuery(
      'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    // Delete session (messages will be deleted due to CASCADE)
    await runQuery('DELETE FROM chat_sessions WHERE id = ?', [sessionId]);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// DELETE /:sessionId/messages
router.delete('/:sessionId/messages', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;

    // Verify session belongs to user
    const session = await getQuery(
      'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    // Delete all messages for the session
    const result = await runQuery('DELETE FROM messages WHERE session_id = ?', [sessionId]);

    // Reset message count and update timestamp
    await runQuery(
      'UPDATE chat_sessions SET message_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [sessionId]
    );

    res.json({
      success: true,
      message: 'Session messages cleared successfully',
      deleted: result.changes
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// GET /:sessionId/export
router.get('/:sessionId/export', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;

    // Verify session belongs to user
    const session = await getQuery(
      'SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    // Get all messages for the session
    const messages = await allQuery(
      'SELECT content, role, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId]
    );

    const exportData = {
      session: {
        id: session.id,
        title: session.title,
        createdAt: session.created_at,
        updatedAt: session.updated_at
      },
      messages: messages.map(msg => ({
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="chat-${sessionId}.json"`);
    res.json(exportData);
    return;
  } catch (error) {
    next(error);
    return;
  }
});

// GET /search/:query
router.get('/search/:query', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.params;
    const userId = (req as any).user.id;

    const sessions = await allQuery(
      `SELECT DISTINCT cs.id, cs.title, cs.created_at, cs.updated_at, cs.message_count
       FROM chat_sessions cs
       LEFT JOIN messages m ON cs.id = m.session_id
       WHERE cs.user_id = ? 
       AND (cs.title LIKE ? OR m.content LIKE ?)
       ORDER BY cs.updated_at DESC`,
      [userId, `%${query}%`, `%${query}%`]
    );

    res.json({
      success: true,
      data: sessions
    });
    return;
  } catch (error) {
    next(error);
    return;
  }
});

export { router as sessionRoutes };

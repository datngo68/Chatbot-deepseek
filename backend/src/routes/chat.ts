import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import { deepSeekService } from '../services/deepseekService';
import { runQuery, getQuery, allQuery } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Middleware to validate request
const validateChatRequest = [
  body('message').isString().trim().isLength({ min: 1, max: 10000 }),
  body('sessionId').optional().isUUID(),
  body('stream').optional().isBoolean()
];

// Send message to DeepSeek
router.post('/send', authenticateToken, validateChatRequest, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { message, sessionId, stream = false } = req.body;
    const userId = (req as any).user.id;

    // Create or get session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const sessionTitle = message.substring(0, 50) + (message.length > 50 ? '...' : '');
      currentSessionId = uuidv4();
      
      await runQuery(
        'INSERT INTO chat_sessions (id, user_id, title) VALUES (?, ?, ?)',
        [currentSessionId, userId, sessionTitle]
      );
    }

    // Save user message
    const userMessageId = uuidv4();
    await runQuery(
      'INSERT INTO messages (id, session_id, content, role) VALUES (?, ?, ?, ?)',
      [userMessageId, currentSessionId, message, 'user']
    );

    // Get conversation history
    const messages = await allQuery(
      'SELECT content, role FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
      [currentSessionId]
    );

    // Prepare messages for DeepSeek API
    const deepSeekMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    if (stream) {
      // Handle streaming response
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const stream = await deepSeekService.streamChat(deepSeekMessages);
        const reader = stream.getReader();
        const decoder = new TextDecoder();

        // Save assistant message ID for streaming
        const assistantMessageId = uuidv4();
        let assistantContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Update the message with final content
                await runQuery(
                  'UPDATE messages SET content = ? WHERE id = ?',
                  [assistantContent, assistantMessageId]
                );
                return res.end();
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  assistantContent += content;
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }

        // Save assistant message
        await runQuery(
          'INSERT INTO messages (id, session_id, content, role) VALUES (?, ?, ?, ?)',
          [assistantMessageId, currentSessionId, assistantContent, 'assistant']
        );

        res.end();
      } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).json({
          success: false,
          error: 'Streaming failed'
        });
      }
    } else {
      // Handle regular response
      const response = await deepSeekService.chat(deepSeekMessages);
      const assistantMessage = response.choices[0].message.content;

      // Save assistant message
      const assistantMessageId = uuidv4();
      await runQuery(
        'INSERT INTO messages (id, session_id, content, role, tokens_used) VALUES (?, ?, ?, ?, ?)',
        [assistantMessageId, currentSessionId, assistantMessage, 'assistant', response.usage.completion_tokens]
      );

      // Update session message count
      await runQuery(
        'UPDATE chat_sessions SET message_count = message_count + 2, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [currentSessionId]
      );

      res.json({
        success: true,
        data: {
          message: assistantMessage,
          sessionId: currentSessionId,
          usage: response.usage
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

// Get messages for a session
router.get('/messages/:sessionId', authenticateToken, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = (req as any).user.id;

    // Verify session belongs to user
    const session = await getQuery(
      'SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?',
      [sessionId, userId]
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const messages = await allQuery(
      'SELECT id, content, role, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId]
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
});

// Delete a message
router.delete('/messages/:messageId', authenticateToken, async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = (req as any).user.id;

    // Verify message belongs to user
    const message = await getQuery(
      `SELECT m.id FROM messages m 
       JOIN chat_sessions cs ON m.session_id = cs.id 
       WHERE m.id = ? AND cs.user_id = ?`,
      [messageId, userId]
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    await runQuery('DELETE FROM messages WHERE id = ?', [messageId]);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as chatRoutes };

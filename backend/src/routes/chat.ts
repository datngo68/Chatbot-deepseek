import { Router, Request, Response, NextFunction } from 'express';
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

// POST /send
router.post('/send', authenticateToken, validateChatRequest, async (req: Request, res: Response, next: NextFunction) => {
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

    const { sessionId, message, stream = false, documentIds = [] } = req.body;
    if (!message) {
      res.status(400).json({ success: false, error: 'message là bắt buộc' });
      return;
    }

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
    let deepSeekMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add knowledge base context if documents are selected
    if (documentIds && documentIds.length > 0) {
      try {
        const knowledgeContext = await buildKnowledgeContext(documentIds, userId);
        if (knowledgeContext) {
          // Add system message with knowledge context
          deepSeekMessages.unshift({
            role: 'system',
            content: `Bạn có thể tham khảo thông tin sau để trả lời câu hỏi: ${knowledgeContext}`
          });
        }
      } catch (error) {
        console.error('Error building knowledge context:', error);
        // Continue without knowledge context if there's an error
      }
    }

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
                // Lưu message hoàn chỉnh
                await runQuery(
                  'INSERT INTO messages (id, session_id, content, role) VALUES (?, ?, ?, ?)',
                  [assistantMessageId, currentSessionId, assistantContent, 'assistant']
                );
                res.end();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices?.[0]?.delta?.content) {
                  const content = parsed.choices[0].delta.content;
                  assistantContent += content;
                  // Gửi từng chunk về frontend
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }

        // Save assistant message if stream ends without [DONE]
        await runQuery(
          'INSERT INTO messages (id, session_id, content, role) VALUES (?, ?, ?, ?)',
          [assistantMessageId, currentSessionId, assistantContent, 'assistant']
        );
        
        res.end();
        return;
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        res.status(500).json({
          success: false,
          error: 'Streaming failed'
        });
        return;
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

      res.status(201).json({ 
        success: true, 
        data: {
          message: assistantMessage,
          sessionId: currentSessionId,
          usage: response.usage,
          knowledgeUsed: documentIds && documentIds.length > 0
        }
      });
      return;
    }
  } catch (err) {
    next(err);
    return;
  }
});

// GET /messages/:sessionId
router.get('/messages/:sessionId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
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

    const messages = await allQuery(
      'SELECT id, content, role, timestamp FROM messages WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId]
    );

    res.json({
      success: true,
      data: messages
    });
    return;
  } catch (err) {
    next(err);
    return;
  }
});

// DELETE /messages/:messageId
router.delete('/messages/:messageId', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
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
      res.status(404).json({
        success: false,
        error: 'Message not found'
      });
      return;
    }

    await runQuery('DELETE FROM messages WHERE id = ?', [messageId]);

    res.status(204).end();
    return;
  } catch (err) {
    next(err);
    return;
  }
});

// Helper function to build knowledge context
async function buildKnowledgeContext(documentIds: string[], userId: string): Promise<string | null> {
  try {
    if (!documentIds || documentIds.length === 0) return null;

    const placeholders = documentIds.map(() => '?').join(',');
    const documents = await allQuery(
      `SELECT title, description, tags FROM knowledge_documents 
       WHERE id IN (${placeholders}) AND user_id = ?`,
      [...documentIds, userId]
    );

    if (documents.length === 0) return null;

    const context = documents.map(doc => 
      `Tài liệu "${doc.title}": ${doc.description || 'Không có mô tả'}. Tags: ${doc.tags || 'Không có tags'}`
    ).join('\n');

    return context;
  } catch (error) {
    console.error('Error building knowledge context:', error);
    return null;
  }
}

export { router as chatRoutes };

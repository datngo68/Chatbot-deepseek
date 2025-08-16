import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { runQuery, getQuery, allQuery } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF, TXT, DOC, DOCX, MD'));
    }
  }
});

// Validation middleware
const validateDocument = [
  body('title').isString().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().isString().trim().isLength({ max: 1000 }),
  body('tags').optional().isString().trim()
];

// GET /documents - Get all documents for user
router.get('/documents', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { search, tag } = req.query;

    let query = `
      SELECT id, title, description, filename, original_name, file_size, tags, created_at, updated_at
      FROM knowledge_documents 
      WHERE user_id = ?
    `;
    let params = [userId];

    if (search) {
      query += ` AND (title LIKE ? OR description LIKE ? OR tags LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (tag) {
      query += ` AND tags LIKE ?`;
      params.push(`%${tag}%`);
    }

    query += ` ORDER BY updated_at DESC`;

    const documents = await allQuery(query, params);

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    next(error);
  }
});

// POST /documents - Upload new document
router.post('/documents', authenticateToken, upload.single('document'), validateDocument, async (req: Request, res: Response, next: NextFunction) => {
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

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Document file is required'
      });
      return;
    }

    const { title, description, tags } = req.body;
    const userId = (req as any).user.id;
    const documentId = uuidv4();

    // Save document info to database
    await runQuery(
      `INSERT INTO knowledge_documents (
        id, user_id, title, description, filename, original_name, 
        file_size, tags, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        documentId, userId, title, description || '', req.file.filename,
        req.file.originalname, req.file.size, tags || ''
      ]
    );

    const document = await getQuery(
      'SELECT * FROM knowledge_documents WHERE id = ?',
      [documentId]
    );

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    // Clean up uploaded file if error occurs
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// GET /documents/:id - Get single document
router.get('/documents/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const document = await getQuery(
      'SELECT * FROM knowledge_documents WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
});

// PUT /documents/:id - Update document metadata
router.put('/documents/:id', authenticateToken, validateDocument, async (req: Request, res: Response, next: NextFunction) => {
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

    const { id } = req.params;
    const { title, description, tags } = req.body;
    const userId = (req as any).user.id;

    // Verify document belongs to user
    const document = await getQuery(
      'SELECT id FROM knowledge_documents WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    await runQuery(
      `UPDATE knowledge_documents 
       SET title = ?, description = ?, tags = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, description || '', tags || '', id]
    );

    const updatedDocument = await getQuery(
      'SELECT * FROM knowledge_documents WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      data: updatedDocument
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /documents/:id - Delete document
router.delete('/documents/:id', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Verify document belongs to user
    const document = await getQuery(
      'SELECT filename FROM knowledge_documents WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    // Delete file from filesystem
    const filePath = `./uploads/documents/${document.filename}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await runQuery('DELETE FROM knowledge_documents WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// GET /documents/:id/content - Get document content for AI processing
router.get('/documents/:id/content', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const document = await getQuery(
      'SELECT filename, original_name FROM knowledge_documents WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!document) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    // For now, return basic info. In production, you'd implement document parsing
    // (PDF parsing, text extraction, etc.)
    res.json({
      success: true,
      data: {
        filename: document.filename,
        originalName: document.original_name,
        content: `Content from ${document.original_name} would be extracted here for AI processing`
      }
    });
  } catch (error) {
    next(error);
  }
});

export { router as knowledgeRoutes };

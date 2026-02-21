const express = require('express');
const router = express.Router();

// Middlewares
const upload = require('../middleware/uploadMiddleware'); // Multer config
const { protect } = require('../middleware/authMiddleware'); // JWT protection
const { validateFile } = require('../middleware/fileValidator'); // File type check
const { toolLimiter } = require('../middleware/rateLimiter');

// Controllers
const { mergePDFs } = require('../controllers/mergeController');
const { splitPDF } = require('../controllers/splitController');
const { compressPDF } = require('../controllers/compressController');
const { convertFile } = require('../controllers/convertController');
const { processGovtPDF } = require('../controllers/govtController');
const { processStudentPDF } = require('../controllers/studentController');
const { getMyFiles, deleteMyFile } = require('../controllers/fileController');

/**
 * @route   POST /api/pdf/merge
 * @desc    Merge multiple PDF files (Max 10 files for free users)
 */
router.post('/merge', toolLimiter, upload.array('files', 20), mergePDFs);

/**
 * @route   POST /api/pdf/split
 * @desc    Split PDF by range
 */
router.post('/split', toolLimiter, upload.single('file'), splitPDF);

/**
 * @route   POST /api/pdf/compress
 * @desc    Compress PDF (Low, Medium, High)
 */
router.post('/compress', toolLimiter, upload.single('file'), compressPDF);

/**
 * @route   POST /api/pdf/convert
 * @desc    Convert PDF to Word / Word to PDF
 */
router.post('/convert', toolLimiter, upload.single('file'), convertFile);

/**
 * @route   POST /api/pdf/govt-compress
 * @desc    Special India Govt Exam Compressor (100kb, 200kb presets)
 */
router.post('/govt-compress', toolLimiter, upload.single('file'), processGovtPDF);

/**
 * @route   POST /api/pdf/student-mode
 * @desc    Clean assignments & format for students
 */
router.post('/student-mode', toolLimiter, upload.array('files', 50), processStudentPDF);

/**
 * @route   GET /api/pdf/history
 * @desc    Get current user's recent processed files
 */
router.get('/history', protect, getMyFiles);

/**
 * @route   DELETE /api/pdf/history/:id
 * @desc    Delete current user's processed file record
 */
router.delete('/history/:id', protect, deleteMyFile);

module.exports = router;

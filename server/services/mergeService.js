const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

/**
 * Service to handle PDF merging logic
 */
class MergeService {
    /**
     * @param {Array} files - Multer कडून आलेल्या फाईल्सची लिस्ट
     * @returns {Object} - प्रोसेस झालेली फाईल माहिती (Buffer and Path)
     */
    async mergeMultiplePDFs(files) {
        try {
            // 1. नवीन रिकामे PDF डॉक्युमेंट तयार करा
            const mergedPdf = await PDFDocument.create();

            // 2. प्रत्येक फाईल प्रोसेस करा
            for (const file of files) {
                const filePath = path.resolve(file.path);
                const pdfBytes = await fs.readFile(filePath);
                
                // PDF लोड करा (जर फाईल करप्ट असेल तर इथे एरर येईल)
                const pdfDoc = await PDFDocument.load(pdfBytes);
                
                // सध्याच्या PDF मधील सर्व पाने कॉपी करा
                const copiedPages = await mergedPdf.copyPages(
                    pdfDoc, 
                    pdfDoc.getPageIndices()
                );

                // कॉपी केलेली पाने नवीन PDF मध्ये ॲड करा
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            // 3. फायनल PDF जनरेट करा (Serialize to bytes)
            const mergedPdfBytes = await mergedPdf.save();

            // 4. युनिक फाईल नेम तयार करा
            const fileName = `merged-${Date.now()}.pdf`;
            const outputPath = path.join(__dirname, '../uploads/', fileName);

            // 5. डिस्कवर फाईल सेव्ह करा
            await fs.writeFile(outputPath, mergedPdfBytes);

            return {
                fileName,
                outputPath,
                size: mergedPdfBytes.length,
                success: true
            };

        } catch (error) {
            console.error('Merge Service Error:', error);
            throw new Error('Failed to merge PDF files: ' + error.message);
        }
    }
}

module.exports = new MergeService();
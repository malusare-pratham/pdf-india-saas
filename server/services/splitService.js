const { PDFDocument } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

/**
 * Service to handle PDF splitting logic
 */
class SplitService {
    /**
     * @param {Object} file - Multer कडून आलेली सिंगल फाईल माहिती
     * @param {Number} startPage - सुरुवात (उदा. १)
     * @param {Number} endPage - शेवट (उदा. ५)
     * @returns {Object} - प्रोसेस झालेली फाईल माहिती
     */
    async splitPDFByRange(file, startPage, endPage) {
        try {
            // 1. मूळ PDF वाचणे
            const filePath = path.resolve(file.path);
            const existingPdfBytes = await fs.readFile(filePath);
            const existingPdfDoc = await PDFDocument.load(existingPdfBytes);
            
            const totalPages = existingPdfDoc.getPageCount();

            // 2. रेंज व्हॅलिडेशन (Range Validation)
            // जर युजरने चुकीची रेंज दिली तर एरर फेकणे
            if (startPage < 1 || endPage > totalPages || startPage > endPage) {
                throw new Error(`Invalid range: PDF has only ${totalPages} pages.`);
            }

            // 3. नवीन कोरे PDF डॉक्युमेंट तयार करा
            const newPdfDoc = await PDFDocument.create();

            // 4. ठराविक पानांची इंडेक्स लिस्ट तयार करणे
            // pdf-lib 0-based index वापरते, म्हणून -1 करणे आवश्यक आहे
            const pagesToExtract = [];
            for (let i = startPage - 1; i < endPage; i++) {
                pagesToExtract.push(i);
            }

            // 5. मूळ PDF मधून पाने कॉपी करा आणि नवीन डॉक्युमेंटमध्ये टाका
            const copiedPages = await newPdfDoc.copyPages(existingPdfDoc, pagesToExtract);
            copiedPages.forEach((page) => newPdfDoc.addPage(page));

            // 6. नवीन PDF फाईल तयार करा (Serialize)
            const splitPdfBytes = await newPdfDoc.save();

            // 7. युनिक फाईल नेम आणि पाथ तयार करा
            const fileName = `split-${Date.now()}.pdf`;
            const outputPath = path.join(__dirname, '../uploads/', fileName);

            // 8. डिस्कवर फाईल सेव्ह करा
            await fs.writeFile(outputPath, splitPdfBytes);

            return {
                fileName,
                outputPath,
                size: splitPdfBytes.length,
                totalPagesExtracted: pagesToExtract.length,
                success: true
            };

        } catch (error) {
            console.error('Split Service Error:', error);
            throw new Error(error.message || 'Failed to split PDF file.');
        }
    }
}

module.exports = new SplitService();
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Service to handle Student-focused PDF tools like Assignment Formatting
 */
class StudentService {
    /**
     * @param {Array} files - Multer कडून आलेल्या इमेज किंवा PDF फाईल्स
     * @param {Object} options - scanClean, autoMargin, brightness
     */
    async formatAssignment(files, options = {}) {
        try {
            const { scanClean = 'true', autoMargin = 'true', brightness = 1.2 } = options;
            
            // 1. नवीन कोरे PDF डॉक्युमेंट तयार करा
            const mergedPdf = await PDFDocument.create();

            for (const file of files) {
                const inputPath = path.resolve(file.path);
                let imageBuffer = await fs.readFile(inputPath);

                // 2. Image Processing (Assignment Cleaning)
                // मोबाईलने काढलेले फोटो डार्क असतात, त्यांना 'Sharp' वापरून पांढरे करणे
                if (scanClean === 'true') {
                    imageBuffer = await sharp(imageBuffer)
                        .grayscale() // ब्लॅक अँड व्हाईट असाइनमेंटसाठी
                        .modulate({
                            brightness: parseFloat(brightness),
                            contrast: 1.5
                        })
                        .threshold(180) // बॅकग्राउंड पूर्ण पांढरे आणि टेक्स्ट गडद करण्यासाठी
                        .toBuffer();
                }

                // 3. इमेजला PDF मध्ये एम्बेड करा
                const image = await mergedPdf.embedJpg(imageBuffer);
                
                // 4. A4 साईज पेज तयार करा [595.28, 841.89] (Standard A4 points)
                const page = mergedPdf.addPage([595.28, 841.89]);
                
                // 5. Margin Logic
                const margin = autoMargin === 'true' ? 40 : 0;
                const maxWidth = 595.28 - (margin * 2);
                const maxHeight = 841.89 - (margin * 2);
                
                // इमेजचे गुणोत्तर (Aspect Ratio) न बिघडवता फिट करणे
                const dims = image.scaleToFit(maxWidth, maxHeight);

                page.drawImage(image, {
                    x: (page.getWidth() - dims.width) / 2,
                    y: (page.getHeight() - dims.height) / 2,
                    width: dims.width,
                    height: dims.height,
                });
            }

            // 6. PDF सेव्ह करा
            const pdfBytes = await mergedPdf.save();
            const fileName = `student-assignment-${Date.now()}.pdf`;
            const outputPath = path.join(__dirname, '../uploads/', fileName);

            await fs.writeFile(outputPath, pdfBytes);

            return {
                fileName,
                outputPath,
                size: pdfBytes.length,
                pageCount: files.length,
                success: true
            };

        } catch (error) {
            console.error('Student Service Error:', error);
            throw new Error('Failed to clean and format assignment PDF.');
        }
    }
}

module.exports = new StudentService();
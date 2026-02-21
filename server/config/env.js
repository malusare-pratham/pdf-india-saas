# 1. Server Configuration
PORT=5000
NODE_ENV=development

# 2. Database Configuration (MongoDB)
# जर तुम्ही लोकल वापरत असाल तर: mongodb://localhost:27017/pdf_india
# जर तुम्ही Atlas वापरत असाल तर तुमची पूर्ण कनेक्शन स्ट्रिंग इथे टाका
MONGO_URI=mongodb+srv://your_username:your_password@cluster0.mongodb.net/pdf_india?retryWrites=true&w=majority

# 3. Authentication (JWT)
# ही की खूप मोठी आणि कॉम्प्लेक्स ठेवा (उदा. 64 characters)
JWT_SECRET=pdf_india_secret_key_2026_secure_ultra_safe
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30

# 4. File Upload Limits
MAX_FILE_SIZE=25000000
UPLOAD_PATH=uploads/

# 5. External API Keys (भविष्यात पेमेंट गेटवेसाठी)
RAZORPAY_KEY_ID=your_razorpay_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# 6. Email Service (OTP पाठवण्यासाठी)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=noreply@pdfindia.com
FROM_NAME=PDF_India_Smart_Tools
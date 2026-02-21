/**
 * Project Wide Constants
 */

module.exports = {
    // १. युजर रोल्स (User Roles)
    ROLES: {
        USER: 'user',
        ADMIN: 'admin',
        MODERATOR: 'moderator'
    },

    // २. सबस्क्रिप्शन प्लॅन्स (Subscription Plans)
    PLANS: {
        FREE: 'free',
        PREMIUM: 'premium',
        ENTERPRISE: 'enterprise'
    },

    // ३. फाईल मर्यादा (File Limits)
    FILE_LIMITS: {
        FREE_SIZE_MB: 5,
        PREMIUM_SIZE_MB: 50,
        MAX_MERGE_FILES: 20
    },

    // ४. सरकारी पोर्टल प्रैसेट्स (Govt Portal Presets)
    GOVT_PRESETS: {
        SSC: { max_kb: 100, dpi: 150 },
        UPSC: { max_kb: 200, dpi: 200 },
        PASSPORT: { max_kb: 500, dpi: 300 }
    },

    // ५. रिस्पॉन्स मेसेजेस (Response Messages)
    MESSAGES: {
        AUTH_SUCCESS: 'लॉगिन यशस्वी झाले!',
        AUTH_FAILED: 'ईमेल किंवा पासवर्ड चुकीचा आहे.',
        FILE_UPLOADED: 'फाईल यशस्वीरित्या अपलोड झाली.',
        LIMIT_EXCEEDED: 'तुमची फाईल मर्यादा संपली आहे. कृपया प्रीमियम प्लॅन घ्या.'
    },

    // ६. स्टेटस कोड्स (HTTP Status Codes)
    STATUS: {
        SUCCESS: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        SERVER_ERROR: 500
    }
};
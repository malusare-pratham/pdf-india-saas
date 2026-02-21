const isAdmin = (req, res, next) => {
    // समजा तुमच्या User model मध्ये 'role' नावाचं field आहे
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access denied. Admin only!" });
    }
};

module.exports = isAdmin; 
/**
 * Role-based access control middleware.
 * Usage: authorize("admin"), authorize("vendor"), authorize("admin", "vendor")
 * Relies on `req.role` being set by the `protect` middleware.
 */
export const authorize = (...roles) => // eslint-disable-next-line @typescript-eslint/no-explicit-any
 (req, res, next) => {
    const role = req.role;
    if (!role || !roles.includes(role)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
};

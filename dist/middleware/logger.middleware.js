// Logs every request method and URL
export const logger = (req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next(); // Continue to next middleware or route
};

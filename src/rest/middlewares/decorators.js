module.exports = (req, res, next) => {
    res.sendSuccess = (data) => {
        return res.status(200).send({
            success: true,
            data
        })
    };

    next();
};
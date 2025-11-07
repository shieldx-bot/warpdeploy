"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/health', async (req, res, next) => {
    res.status(200).send("Control Plane Service is healthy");
});
exports.default = router;

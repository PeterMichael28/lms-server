"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const layoutController_1 = require("../controllers/layoutController");
const layoutRouter = express_1.default.Router();
layoutRouter.post('/create-layout', auth_1.isAuthenticated, (0, auth_1.authorizeRoles)('admin'), layoutController_1.createLayout);
layoutRouter.put('/update-layout', auth_1.isAuthenticated, (0, auth_1.authorizeRoles)('admin'), layoutController_1.updateLayout);
layoutRouter.get('/get-layout/:type', auth_1.isAuthenticated, (0, auth_1.authorizeRoles)('admin'), layoutController_1.getLayoutByType);
exports.default = layoutRouter;

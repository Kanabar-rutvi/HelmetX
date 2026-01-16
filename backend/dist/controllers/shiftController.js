"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteShift = exports.updateShift = exports.createShift = exports.getShifts = void 0;
const Shift_1 = __importDefault(require("../models/Shift"));
const getShifts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shifts = yield Shift_1.default.find().populate('siteId', 'name');
        res.json(shifts);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching shifts' });
    }
});
exports.getShifts = getShifts;
const createShift = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shift = new Shift_1.default(req.body);
        yield shift.save();
        res.status(201).json(shift);
    }
    catch (error) {
        res.status(500).json({ message: 'Error creating shift' });
    }
});
exports.createShift = createShift;
const updateShift = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shift = yield Shift_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(shift);
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating shift' });
    }
});
exports.updateShift = updateShift;
const deleteShift = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Shift_1.default.findByIdAndDelete(req.params.id);
        res.json({ message: 'Shift deleted' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error deleting shift' });
    }
});
exports.deleteShift = deleteShift;

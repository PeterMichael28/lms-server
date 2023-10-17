"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLast1YearData = void 0;
async function generateLast1YearData(model) {
    const last1Year = [];
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    for (let i = 11; i >= 0; i--) {
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i * 28);
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 28);
        const monthYear = endDate.toLocaleString("default", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
        const count = await model.countDocuments({
            createdAt: {
                $gte: startDate,
                $lt: endDate,
            },
        });
        last1Year.push({ month: monthYear, count });
    }
    return { last1Year };
}
exports.generateLast1YearData = generateLast1YearData;

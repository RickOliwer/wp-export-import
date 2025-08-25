import pino from "pino";
const baseOptions = {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
};
const devOptions = {
    ...baseOptions,
    transport: { target: "pino-pretty" },
};
export const logger = pino(process.env.NODE_ENV === "production" ? baseOptions : devOptions);
//# sourceMappingURL=index.js.map
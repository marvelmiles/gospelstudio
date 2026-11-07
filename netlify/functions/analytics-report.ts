import { createReportHandler } from "../../server/analytics/reportHandler";

export default createReportHandler({ env: process.env });

export const config = {
  path: "/api/analytics/report",
};

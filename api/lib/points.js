/**
 * Point system configuration for EcoFlow Waste Management
 * 
 * Points are awarded for:
 * - Reporting waste: REPORT_POINTS
 * - Collecting waste: COLLECT_POINTS (only if enableCollector === true)
 * 
 * Global points = reporterPoints + collectorPoints
 */

export const REPORT_POINTS = 10;
export const COLLECT_POINTS = 20;

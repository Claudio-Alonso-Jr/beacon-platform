import { createContext, useContext } from "react";

/**
 * True inside the /report route. Widgets with in-viewport entrance
 * animations render their final static state instead, so below-the-fold
 * visuals are complete when the browser prints.
 */
export const ReportModeContext = createContext(false);

export function useReportMode(): boolean {
  return useContext(ReportModeContext);
}

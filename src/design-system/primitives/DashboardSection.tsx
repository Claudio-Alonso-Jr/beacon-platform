import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../cn";
import { SectionHeader } from "./SectionHeader";

export interface DashboardSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Suppresses the entrance animation (e.g. print/report layout). */
  animate?: boolean;
}

/**
 * The narrative unit of the dashboard (§7.6): one chapter, one story.
 * Standardizes vertical rhythm (96/48/40px), the out-of-card heading,
 * and the fade-up reveal. Sections are anchor targets for the rail.
 */
export function DashboardSection({
  id,
  title,
  description,
  children,
  className,
  animate = true,
}: DashboardSectionProps) {
  return (
    <motion.section
      id={id}
      data-dashboard-section
      initial={animate ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn(
        "mt-section-sm scroll-mt-24 md:mt-section-md lg:mt-section",
        className,
      )}
    >
      <SectionHeader title={title} description={description} />
      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}

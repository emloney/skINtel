import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import {
  detectConflicts,
  fetchConflictRules,
  ShelfProduct,
  DetectedConflict,
} from "../lib/conflictDetection";

interface ShelfConflictsPanelProps {
  shelfProducts: ShelfProduct[];
}

const severityStyles = {
  mild: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-900",
    icon: "text-yellow-600",
    label: "Mild",
  },
  moderate: {
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-900",
    icon: "text-orange-600",
    label: "Moderate",
  },
  severe: {
    bg: "bg-red-50",
    border: "border-red-300",
    text: "text-red-900",
    icon: "text-red-600",
    label: "Severe",
  },
};

export function ShelfConflictsPanel({ shelfProducts }: ShelfConflictsPanelProps) {
  const [conflicts, setConflicts] = useState<DetectedConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rules = await fetchConflictRules();
      if (cancelled) return;
      const detected = detectConflicts(shelfProducts, rules);
      // sort by severity (severe first)
      const order = { severe: 0, moderate: 1, mild: 2 };
      detected.sort((a, b) => order[a.severity] - order[b.severity]);
      setConflicts(detected);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [shelfProducts]);

  // Don't render anything until we've checked
  if (loading) return null;

  // If shelf is empty or conflict-free, show a small positive note
  if (conflicts.length === 0) {
    if (shelfProducts.length < 2) return null;
    return (
      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        No known ingredient conflicts across your shelf. Your routine looks compatible.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-orange-800">
        <AlertTriangle className="h-5 w-5" />
        <h3 className="text-sm font-semibold">
          {conflicts.length} routine conflict{conflicts.length > 1 ? "s" : ""} found
        </h3>
      </div>

      <AnimatePresence>
        {conflicts.map((conflict, idx) => {
          const s = severityStyles[conflict.severity];
          const isExpanded = expandedIndex === idx;
          return (
            <motion.div
              key={`${conflict.productA.id}-${conflict.productB.id}-${conflict.ingredientA}`}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`rounded-lg border ${s.bg} ${s.border} p-3`}
            >
              <button
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="flex w-full items-start justify-between text-left"
              >
                <div className="flex-1">
                  <div className={`text-xs font-semibold uppercase ${s.icon}`}>
                    {s.label} conflict
                  </div>
                  <div className={`mt-1 text-sm font-semibold ${s.text}`}>
                    {conflict.productA.product_name}{" "}
                    <span className="opacity-60">×</span>{" "}
                    {conflict.productB.product_name}
                  </div>
                  <div className={`mt-1 text-xs ${s.text} opacity-80`}>
                    Contains: <span className="capitalize">{conflict.ingredientA}</span> +{" "}
                    <span className="capitalize">{conflict.ingredientB}</span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className={`h-4 w-4 ${s.icon}`} />
                ) : (
                  <ChevronDown className={`h-4 w-4 ${s.icon}`} />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className={`mt-3 border-t border-current pt-3 text-sm ${s.text} opacity-90`}>
                      <p>{conflict.reason}</p>
                      {conflict.advice && (
                        <p className="mt-2 font-medium">💡 {conflict.advice}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

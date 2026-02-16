export const VENUE_COLORS = {
	Conference: "#10b981", // Emerald
	Journal: "#6366f1", // Indigo
	Preprint: "#f59e0b", // Amber
	Workshop: "#ec4899", // Pink
} as const;

export type VenueType = keyof typeof VENUE_COLORS;

export const THEME_DARK = {
	impact: {
		grid: "#475569",
		nodeTarget: "#0f172a",
		strokeTarget: "#94a3b8",
		strokeSource: "#818cf8",
		textSource: "#e2e8f0",
		textTarget: "#64748b",
		link: "#34d399",
		linkHover: "#fbbf24",
		internalRing: "#64748b",
		hoverOverlay: "rgba(15, 23, 42, 0.95)",
	},
	cybernetic: {
		nodeFill: "#0f172a",
		text: "#cbd5e1",
        nodeStroke: "#ffffff",
		bgLink: "#475569",
		bgNode: "#94a3b8",
        overlayFill: "rgba(0,0,0,0.5)",
        arrowFill: "#ffffff",
        textShadow: "0 0 5px rgba(0,0,0,0.8)",
		groups: {
			input: "#38bdf8",
			process: "#10b981",
			control: "#f59e0b",
			output: "#8b5cf6",
			reach: "#ec4899",
			enrichment: "#6366f1",
			background: "#94a3b8",
		},
	},
} as const;

export const THEME_LIGHT = {
	impact: {
		grid: "#d6d3d1",
		nodeTarget: "#fafaf9",
		strokeTarget: "#a8a29e",
		strokeSource: "#6366f1",
		textSource: "#0c0a09",
		textTarget: "#78716c",
		link: "#059669",
		linkHover: "#d97706",
		internalRing: "#a8a29e",
		hoverOverlay: "rgba(250, 250, 249, 0.95)",
	},
	cybernetic: {
		nodeFill: "#fafaf9",
		text: "#44403c",
        nodeStroke: "#000000",
		bgLink: "#d6d3d1",
		bgNode: "#a8a29e",
        overlayFill: "rgba(0,0,0,0.5)",
        arrowFill: "#ffffff",
        textShadow: "none",
		groups: {
			input: "#0ea5e9",
			process: "#059669",
			control: "#d97706",
			output: "#7c3aed",
			reach: "#db2777",
			enrichment: "#4f46e5",
			background: "#78716c",
		},
	},
} as const;

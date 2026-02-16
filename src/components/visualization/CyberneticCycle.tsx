import * as d3 from "d3";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { THEME_DARK, THEME_LIGHT } from "../../styles/constants";
import { Card } from "../ui/Card";
import { MonoText } from "../ui/MonoText";
import clsx from "clsx";

interface CyberNode extends d3.SimulationNodeDatum {
	id: string;
	group: "input" | "process" | "control" | "output" | "reach" | "enrichment" | "background";
	label: string;
	sectionId: string;
	r: number;
	initX: number;
	initY: number;
	x?: number;
	y?: number;
	vx?: number;
	vy?: number;
}

interface CyberLink extends d3.SimulationLinkDatum<CyberNode> {
	source: string | CyberNode;
	target: string | CyberNode;
	type: "flow" | "feedback";
}

interface Particle {
	id: number;
	source: CyberNode;
	target: CyberNode;
	t: number;
	speed: number;
	color: string;
	x?: number;
	y?: number;
}

const getControlPoint = (src: { x: number; y: number }, tgt: { x: number; y: number }) => {
	const mx = (src.x + tgt.x) / 2;
	const my = (src.y + tgt.y) / 2;
	const dx = tgt.x - src.x;
	const dy = tgt.y - src.y;
	const curvature = 0.25;
	return {
		x: mx - dy * curvature,
		y: my + dx * curvature,
	};
};

const makeNode = (group: CyberNode["group"], label: string, r: number, initX: number, initY: number): CyberNode => ({
	id: group,
	group,
	label,
	sectionId: label.toLowerCase().replace(/_/g, "-"),
	r,
	initX,
	initY,
});

const nodesData: CyberNode[] = [
	makeNode("input", "SYSTEM_INPUT", 20, 300, 350),
	makeNode("background", "BACKGROUND_PROCESSES", 18, 600, 150),
	makeNode("enrichment", "SIGNAL_ENRICHMENT", 15, 500, 250),
	makeNode("process", "ACTIVE_MODULES", 25, 450, 100),
	makeNode("control", "RUNTIME_DIAGNOSTICS", 20, 300, 150),
	makeNode("output", "OUTPUT_BUFFER", 18, 100, 150),
	makeNode("reach", "SYSTEM_REACH", 30, 200, 350),
];

const linksData: CyberLink[] = [
	// Main Flow
	{ source: "input", target: "process", type: "flow" },
	{ source: "process", target: "control", type: "flow" },
	{ source: "control", target: "output", type: "flow" },
	{ source: "output", target: "reach", type: "flow" },

	// Inputs & Enrichment
	{ source: "background", target: "enrichment", type: "flow" },
	{ source: "enrichment", target: "process", type: "flow" },

	// Feedback Loops
	{ source: "control", target: "input", type: "feedback" },
	{ source: "reach", target: "input", type: "feedback" },
	{ source: "input", target: "enrichment", type: "feedback" },
];
const PRIMARY_FONT_SIZE = 12;
const SECONDARY_FONT_SIZE = 12;
export const CyberneticCycle: React.FC = () => {
	const svgRef = useRef<SVGSVGElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [hoverNode, setHoverNode] = useState<{ id: string; label: string; sectionId: string } | null>(null);
	const { theme } = useTheme();

	const simulationRef = useRef<d3.Simulation<CyberNode, undefined> | null>(null);
	const nodes = React.useMemo(() => JSON.parse(JSON.stringify(nodesData)) as CyberNode[], []);
	const links = React.useMemo(() => JSON.parse(JSON.stringify(linksData)) as CyberLink[], []);

	const handleNodeClick = (sectionId: string) => {
		const section = document.getElementById(sectionId);
		if (section) {
			section.scrollIntoView({ behavior: "smooth", block: "center" });
			section.classList.add("ring-2", "ring-emerald-500", "shadow-[0_0_50px_rgba(16,185,129,0.3)]");
			setTimeout(() => {
				section.classList.remove("ring-2", "ring-emerald-500", "shadow-[0_0_50px_rgba(16,185,129,0.3)]");
			}, 2000);
		}
	};

	const handleReset = () => {
		if (simulationRef.current) {
			simulationRef.current.stop();
			simulationRef.current.nodes().forEach((node) => {
				if (typeof node.initX === "number" && typeof node.initY === "number") {
					node.x = node.initX;
					node.y = node.initY;
					node.vx = 0;
					node.vy = 0;
				}
			});
			simulationRef.current.alpha(1).restart();
		}
	};

	useEffect(() => {
		if (!containerRef.current) return;

		const resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const { width, height } = entry.contentRect;
				setDimensions({ width, height });
			}
		});

		resizeObserver.observe(containerRef.current);

		return () => resizeObserver.disconnect();
	}, []);

	useEffect(() => {
		if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

		const colors = theme === "dark" ? THEME_DARK.cybernetic : THEME_LIGHT.cybernetic;
		const { width, height } = dimensions;
		d3.select(svgRef.current).selectAll("*").remove();
		const svg = d3
			.select(svgRef.current)
			.attr("viewBox", [0, 0, width, height])
			.style("width", "100%")
			.style("height", "100%");
		const getGroupColor = (group: string) => {
			return colors.groups[group as keyof typeof colors.groups] || colors.bgNode;
		};
		function dragstarted(event: d3.D3DragEvent<SVGGElement, CyberNode, CyberNode>, d: CyberNode) {
			if (!event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}
		function dragged(event: d3.D3DragEvent<SVGGElement, CyberNode, CyberNode>, d: CyberNode) {
			d.fx = event.x;
			d.fy = event.y;
		}
		function dragended(event: d3.D3DragEvent<SVGGElement, CyberNode, CyberNode>, d: CyberNode) {
			if (!event.active) simulation.alphaTarget(0.02);
			d.fx = null;
			d.fy = null;
		}

		let particles: Particle[] = [];
		let particleIdCounter = 0;

		nodes.forEach((n) => {
			if (n.x === undefined && n.initX !== undefined) n.x = n.initX;
			if (n.y === undefined && n.initY !== undefined) n.y = n.initY;
		});

		const simulation = d3
			.forceSimulation<CyberNode>(nodes)
			.alphaTarget(0.02)
			.force(
				"link",
				d3
					.forceLink<CyberNode, CyberLink>(links)
					.id((d) => d.id)
					.distance((d) => (d.type === "feedback" ? 200 : 120)),
			)
			.force("charge", d3.forceManyBody().strength(-400))
			.force("x", d3.forceX<CyberNode>((d) => d.initX).strength(0.5))
			.force("y", d3.forceY<CyberNode>((d) => d.initY).strength(0.5))
			.force(
				"collide",
				d3.forceCollide().radius((d) => (d as CyberNode).r + 30),
			);

		simulationRef.current = simulation;

		const defs = svg.append("defs");

		defs.selectAll("marker")
			.data(Object.keys(colors.groups))
			.join("marker")
			.attr("id", (d) => `arrow-${d}`)
			.attr("viewBox", "0 -5 10 10")
			.attr("refX", 35)
			.attr("refY", 0)
			.attr("markerWidth", 6)
			.attr("markerHeight", 6)
			.attr("orient", "auto")
			.append("path")
			.attr("fill", (d) => colors.groups[d as keyof typeof colors.groups])
			.attr("d", "M0,-5L10,0L0,5");

		const filter = defs.append("filter").attr("id", "glow");
		filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");

		const feMerge = filter.append("feMerge");
		feMerge.append("feMergeNode").attr("in", "coloredBlur");
		feMerge.append("feMergeNode").attr("in", "SourceGraphic");

		const link = svg
			.append("g")
			.selectAll("path")
			.data(links)
			.join("path")
			.attr("fill", "none")
			.attr("stroke", (d) => getGroupColor((d.source as CyberNode).group))
			.attr("stroke-width", (d) => (d.type === "flow" ? 2 : 1.5))
			.attr("stroke-opacity", 0.4)
			.attr("stroke-dasharray", (d) => (d.type === "feedback" ? "5,5" : null))
			.attr("marker-end", (d) => {
				return `url(#arrow-${(d.source as CyberNode).group})`;
			});

		const particleGroup = svg.append("g");

		const node = svg
			.append("g")
			.selectAll<SVGGElement, CyberNode>("g")
			.data(nodes)
			.join("g")
			.attr("cursor", "pointer")
			.call(d3.drag<SVGGElement, CyberNode>().on("start", dragstarted).on("drag", dragged).on("end", dragended))
			.on("click", (_, d) => handleNodeClick(d.sectionId))
			.on("mouseenter", (e, d) => {
				setHoverNode({ id: d.sectionId, label: d.label, sectionId: d.sectionId });
				d3.select(e.currentTarget).select(".node-overlay").transition().duration(200).attr("opacity", 1);
				d3.select(e.currentTarget).select("circle").attr("stroke", colors.nodeStroke);
			})
			.on("mouseleave", (e) => {
				setHoverNode(null);
				d3.select(e.currentTarget).select(".node-overlay").transition().duration(200).attr("opacity", 0);
				d3.select(e.currentTarget)
					.select("circle")
					.attr("stroke", function () {
						return d3.select(this).attr("data-stroke");
					});
			});

		node.append("circle")
			.attr("r", (d) => d.r)
			.attr("fill", colors.nodeFill)
			.attr("stroke", (d) => getGroupColor(d.group))
			.attr("data-stroke", (d) => getGroupColor(d.group))
			.attr("stroke-width", 2)
			.style("filter", "url(#glow)");

		const overlay = node
			.append("g")
			.attr("class", "node-overlay")
			.attr("opacity", 0)
			.style("pointer-events", "none");

		overlay
			.append("circle")
			.attr("r", (d) => d.r)
			.attr("fill", colors.overlayFill);

		overlay
			.append("path")
			.attr("d", "M -3,-5 L 5,0 L -3,5 Z")
			.attr("fill", colors.arrowFill)
			.attr("transform", "scale(1.5)");

		node.append("text")
			.text((d) => d.label)
			.attr("x", 0)
			.attr("y", (d) => d.r + 15)
			.attr("text-anchor", "middle")
			.attr("fill", colors.text)
			.attr("font-family", "monospace")
			.attr("font-size", `${PRIMARY_FONT_SIZE}px`)
			.style("pointer-events", "none")
			.style("text-shadow", colors.textShadow);

		simulation.on("tick", () => {
			link.attr("d", (d) => {
				const src = d.source as CyberNode;
				const tgt = d.target as CyberNode;

				if (d.type === "flow") {
					return `M${src.x},${src.y}L${tgt.x},${tgt.y}`;
				}

				if (src.x !== undefined && src.y !== undefined && tgt.x !== undefined && tgt.y !== undefined) {
					const cp = getControlPoint({ x: src.x, y: src.y }, { x: tgt.x, y: tgt.y });
					return `M${src.x},${src.y}Q${cp.x},${cp.y} ${tgt.x},${tgt.y}`;
				}
				return "";
			});

			node.attr("transform", (d) => `translate(${d.x},${d.y})`);

			links.forEach((l) => {
				if (Math.random() < 0.03) {
					const sourceNode = l.source as CyberNode;
					particles.push({
						source: l.source as CyberNode,
						target: l.target as CyberNode,
						t: 0,
						speed: l.type === "feedback" ? 0.005 : 0.01 + Math.random() * 0.005,
						color: getGroupColor(sourceNode.group),
						id: particleIdCounter++,
					});
				}
			});

			const activeParticles: Particle[] = [];
			for (const p of particles) {
				p.t += p.speed;
				if (p.t < 1) {
					const src = p.source;
					const tgt = p.target;

					if (src.x !== undefined && src.y !== undefined && tgt.x !== undefined && tgt.y !== undefined) {
						const isFeedback =
							(src.id === "control" && tgt.id === "input") ||
							(src.id === "reach" && tgt.id === "input") ||
							(src.id === "input" && tgt.id === "enrichment");

						if (isFeedback) {
							const cp = getControlPoint({ x: src.x, y: src.y }, { x: tgt.x, y: tgt.y });
							const t = p.t;

							const bx = Math.pow(1 - t, 2) * src.x + 2 * (1 - t) * t * cp.x + Math.pow(t, 2) * tgt.x;
							const by = Math.pow(1 - t, 2) * src.y + 2 * (1 - t) * t * cp.y + Math.pow(t, 2) * tgt.y;

							const tx = 2 * (1 - t) * (cp.x - src.x) + 2 * t * (tgt.x - cp.x);
							const ty = 2 * (1 - t) * (cp.y - src.y) + 2 * t * (tgt.y - cp.y);

							const len = Math.sqrt(tx * tx + ty * ty);
							const ux = tx / len;
							const uy = ty / len;

							const offset = 10;

							p.x = bx - uy * offset;
							p.y = by + ux * offset;
						} else {
							p.x = src.x + (tgt.x - src.x) * p.t;
							p.y = src.y + (tgt.y - src.y) * p.t;
						}
						activeParticles.push(p);
					}
				}
			}
			particles = activeParticles;

			particleGroup
				.selectAll<SVGCircleElement, Particle>("circle")
				.data(particles, (d) => d.id)
				.join("circle")
				.attr("r", 3)
				.attr("fill", (d) => d.color)
				.attr("filter", "url(#glow)")
				.attr("cx", (d) => d.x!)
				.attr("cy", (d) => d.y!);
		});

		return () => {
			simulation.stop();
		};
	}, [theme, dimensions, nodes, links]);

	return (
		<div
			className={clsx(
				"h-[500px] border border-border-color rounded-lg",
				"bg-bg-secondary/50 relative overflow-hidden group mb-4",
			)}
		>
			<Card
				className={clsx(
					"w-full h-full border-accent-primary/20",
					"bg-bg-secondary/50 relative backdrop-blur-sm transition-colors duration-300",
				)}
			>
				<div ref={containerRef} className="w-full h-full">
					<div className="absolute top-4 left-4 pointer-events-none">
						<MonoText className="text-accent-primary uppercase tracking-widest">Cybernetic_Loop</MonoText>
					</div>
					<svg ref={svgRef} className="w-full h-full cursor-pointer active:cursor-grabbing" />
				</div>

				<div className="absolute top-4 right-4 z-30">
					<button
						onClick={handleReset}
						className={clsx(
							`text-[${SECONDARY_FONT_SIZE}px]`,
							"font-mono text-text-secondary hover:text-accent-primary uppercase",
							"border border-border-color px-2 py-1 tracking-wider rounded",
							"bg-bg-secondary/80 hover:bg-bg-primary  transition-colors",
						)}
					>
						[ Reset View ]
					</button>
				</div>

				{hoverNode && (
					<div
						className={clsx(
							"absolute bottom-4 left-4 z-50",
							"bg-bg-secondary/95 border border-accent-primary/30 p-3 rounded-md shadow-xl",
							"backdrop-blur-sm pointer-events-none",
						)}
					>
						<div className={clsx(`text-[${PRIMARY_FONT_SIZE}px]`, "font-mono text-accent-primary mb-1")}>
							&gt; {hoverNode.label.split("_").join(" ")}
						</div>
						<div className={clsx(`text-[${SECONDARY_FONT_SIZE}px]`, "text-text-secondary font-mono")}>
							[ Click to Navigate ]
						</div>
					</div>
				)}
			</Card>
		</div>
	);
};

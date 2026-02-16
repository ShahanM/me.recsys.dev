import { clsx, type ClassValue } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Calendar, Layers, Link as LinkIcon, MoreHorizontal, Users } from "lucide-react";
import React, { useState } from "react";
import { twMerge } from "tailwind-merge";
import pubData from "../../data/publications.json";
import { MonoText } from "../ui/MonoText";
import { VENUE_COLORS } from "../../styles/constants";
import { Card } from "../ui/Card";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

interface Author {
	first: string;
	last: string;
}

interface Publication {
	id: number;
	title: string;
	year: string;
	venue: string;
	url: string;
	doi: string;
	authors: Author[];
}

type FilterType = "ALL" | "JOURNAL" | "CONFERENCE" | "OTHER";

const getPublicationType = (venue: string): FilterType => {
	const v = venue.toLowerCase();
	if (v.includes("journal") || v.includes("transactions") || v.includes("computers and education")) {
		return "JOURNAL";
	}
	if (
		v.includes("workshop") ||
		v.includes("symposium") ||
		v.includes("poster") ||
		v.includes("demo") ||
		v.includes("consortium") ||
		v.includes("artiv")
	) {
		return "OTHER";
	}
	return "CONFERENCE";
};

export const PublicationList: React.FC = () => {
	const [filter, setFilter] = useState<FilterType>("ALL");

	const filteredPubs = (pubData as Publication[]).filter((pub) => {
		if (filter === "ALL") return true;
		return getPublicationType(pub.venue) === filter;
	});

	const formatAuthors = (authors: Author[]) => {
		return authors.map((author, index) => {
			const isMe = author.first === "Mehtab" && author.last === "Iqbal";
			return (
				<span key={index}>
					{isMe ? (
						<span className="font-bold text-text-primary border-b border-accent-primary/50">
							{author.last}, {author.first.charAt(0)}.
						</span>
					) : (
						<span className="text-text-secondary">
							{author.last}, {author.first.charAt(0)}.
						</span>
					)}
					{index < authors.length - 1 && ", "}
				</span>
			);
		});
	};

	const filters: { id: FilterType; label: string; icon: React.ReactNode }[] = [
		{ id: "ALL", label: "ALL", icon: <Layers size={14} /> },
		{ id: "JOURNAL", label: "JOURNALS", icon: <BookOpen size={14} /> },
		{ id: "CONFERENCE", label: "CONFS", icon: <Users size={14} /> },
		{ id: "OTHER", label: "OTHER", icon: <MoreHorizontal size={14} /> },
	];

	return (
		<Card className="p-6 bg-bg-secondary/30 transition-colors duration-300">
			<div className="space-y-6">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-4">
					<div className="flex items-center gap-2 text-accent-primary">
						<span className="animate-pulse">▶</span>
						<MonoText className="uppercase tracking-wider">SHOWING {filter} PUBLICATIONS_</MonoText>
						<span className="text-text-muted font-mono text-xs">({filteredPubs.length})</span>
					</div>

					<div className="flex bg-bg-secondary border border-border-color rounded-lg p-1 gap-1">
						{filters.map((f) => {
							const getColor = (id: FilterType) => {
								switch (id) {
									case "ALL":
										return VENUE_COLORS.Preprint;
									case "JOURNAL":
										return VENUE_COLORS.Journal;
									case "CONFERENCE":
										return VENUE_COLORS.Conference;
									case "OTHER":
										return VENUE_COLORS.Workshop;
									default:
										return VENUE_COLORS.Preprint;
								}
							};

							return (
								<button
									key={f.id}
									onClick={() => setFilter(f.id)}
									className={cn(
										"relative px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-all min-w-[60px] flex justify-center items-center z-0 cursor-pointer",
										filter === f.id ? "text-white" : "text-text-muted hover:text-text-primary",
									)}
								>
									{filter === f.id && (
										<motion.div
											layoutId="activeFilter"
											className="absolute inset-0 rounded-md -z-10"
											style={{ backgroundColor: getColor(f.id) }}
											transition={{ type: "spring", stiffness: 300, damping: 20 }}
										/>
									)}
									<span className="relative z-10">{filter === f.id ? f.icon : f.label}</span>
								</button>
							);
						})}
					</div>
				</div>

				<div className="space-y-6">
					<AnimatePresence mode="popLayout">
						{filteredPubs.map((pub) => (
							<motion.div
								key={pub.id}
								layout
								initial={{ opacity: 0, x: -10 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 10 }}
								transition={{ duration: 0.2 }}
								className="group relative pl-4 border-l-2 border-border-color hover:border-accent-primary transition-colors"
							>
								<div className="flex items-center gap-3 text-xs font-mono text-accent-primary mb-1">
									<span className="flex items-center gap-1">
										<Calendar size={10} />
										{pub.year}
									</span>
									<span>//</span>
									<span className="uppercase tracking-wide">{pub.venue}</span>
								</div>

								<h3 className="text-text-primary font-semibold text-lg leading-tight mb-2 group-hover:text-accent-primary transition-colors">
									{pub.title}
								</h3>
								<div className="text-sm leading-relaxed mb-3">{formatAuthors(pub.authors)}</div>

								<div className="flex gap-4 text-xs font-mono">
									{pub.url && (
										<a
											href={pub.url}
											target="_blank"
											rel="noreferrer"
											className="flex items-center gap-1 text-text-muted hover:text-accent-primary"
										>
											<LinkIcon size={10} /> DIRECT_LINK
										</a>
									)}
									{pub.doi && (
										<a
											href={`https://doi.org/${pub.doi}`}
											target="_blank"
											rel="noreferrer"
											className="flex items-center gap-1 text-text-muted hover:text-accent-primary"
										>
											<BookOpen size={10} /> DOI_RESOLVER
										</a>
									)}
								</div>
							</motion.div>
						))}
					</AnimatePresence>

					{filteredPubs.length === 0 && (
						<div className="text-center py-10 text-text-muted font-mono text-xs">
							[ NO RECORDS FOUND FOR QUERY: TYPE={filter} ]
						</div>
					)}
				</div>
			</div>
		</Card>
	);
};

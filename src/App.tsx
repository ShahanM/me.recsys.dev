import { Activity, BookOpen, Cpu, Network, type LucideIcon } from "lucide-react";
import { SystemIdentity } from "./components/layout/SystemIdentity";
import ProjectList from "./components/modules/ProjectList";
import { PublicationList } from "./components/modules/PublicationList";
import { SystemLog } from "./components/modules/SystemLog";
import { ImpactNetwork } from "./components/visualization/ImpactNetwork";
import { CyberneticCycle } from "./components/visualization/CyberneticCycle";

import { CitationDiet } from "./components/visualization/CitationDiet";
import ProcessList from "./components/modules/ProcessList";
import { SecretTerminal } from "./components/modules/ScreenTerminal";
import { ThemeProvider } from "./context/ThemeContext";
import { ThemeToggle } from "./components/layout/ThemeToggle";
import { Card } from "./components/ui/Card";
import { SectionHeader } from "./components/ui/SectionHeader";

function App() {
	return (
		<ThemeProvider>
			<div className="min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-accent-primary/30 transition-colors duration-300">
				<div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
					<header className="relative flex justify-between items-start">
						<SystemIdentity />
						<div className="absolute top-0 right-0 z-10">
							<ThemeToggle />
						</div>
					</header>

					<main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
						<MainContent />
						<Sidebar />
					</main>

					<footer className="border-t border-border-color pt-8 pb-4 text-left">
						<p className="text-text-secondary font-mono text-xs">
							The author of this site is Mehtab "Shahan" Iqbal. The content of this site is shared under
							the MIT License. You are free to use, modify, and distribute this content as per the MIT
							License. If you have any questions or suggestions, please reach out to{" "}
							<span className="text-accent-primary">mehtabi [at] clemson [dot] edu</span>.
						</p>
					</footer>
				</div>
				<SecretTerminal />
			</div>
		</ThemeProvider>
	);
}

function MainContent() {
	return (
		<div className="lg:col-span-8 space-y-12">
			<MainContentSection title="System_Architecture" subtitle="Feedback_Loops" icon={Activity}>
				<CyberneticCycle />
			</MainContentSection>

			<MainContentSection title="System_Reach" subtitle="Impact_Network" icon={Network}>
				<ImpactNetwork />
			</MainContentSection>

			<MainContentSection title="Active_Modules" subtitle="Projects" icon={Cpu}>
				<ProjectList />
			</MainContentSection>

			<MainContentSection title="Output_Buffer" subtitle="Publications" icon={BookOpen}>
				<PublicationList />
			</MainContentSection>
		</div>
	);
}

const MainContentSection = ({
	title,
	subtitle,
	icon,
	children,
}: {
	title: string;
	subtitle: string;
	icon: LucideIcon | undefined;
	children: React.ReactNode;
}) => {
	return (
		<section
			id={title.toLowerCase().replace("_", "-")}
			className="space-y-4 transition-all duration-500 rounded-lg my-2 p-2"
		>
			<SectionHeader title={title} subtitle={subtitle} icon={icon} />
			{children}
		</section>
	);
};

function Sidebar() {
	return (
		<aside className="lg:col-span-4 space-y-8">
			<Card id="signal-enrichment" variant="glass" className="p-6 transition-all duration-500">
				<h3 className="text-accent-primary font-mono mb-3 text-sm">&lt;Abstract /&gt;</h3>
				<p className="text-text-secondary text-sm leading-relaxed">
					I investigate the feedback loops in AI pipelines. My work deconstructs complex recommender systems
					into tangible control elements that users can understand and developers can reason about.
				</p>
				<p className="text-accent-primary">
					[Disclaimer]: This is a work in progress, currently in the very first deployment. Please expect bugs
					and issues. Most importantly, the information presented is incomplete.
				</p>
			</Card>

			<SidebarSection title="Runtime_Diagnostics">
				<SystemLog />
			</SidebarSection>

			<SidebarSection title="System_Input">
				<CitationDiet />
			</SidebarSection>

			<SidebarSection title="Background_Processes">
				<ProcessList />
			</SidebarSection>
		</aside>
	);
}

const SidebarSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
	return (
		<div
			id={title.toLowerCase().replace("_", "-")}
			className="space-y-2 transition-all duration-500 rounded-lg my-2 p-2"
		>
			<SectionHeader title={title} />
			{children}
		</div>
	);
};

export default App;

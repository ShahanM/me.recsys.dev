import { useEffect, useState } from "react";

export interface ActivityEvent {
	id: string;
	type:
		| "PushEvent"
		| "PullRequestEvent"
		| "IssueCommentEvent"
		| "CreateEvent"
		| "WatchEvent"
		| "PullRequestReviewEvent"
		| "ForkEvent"
		| string;
	repo: { name: string; url: string };
	payload: {
		action?: string;
		ref?: string;
		ref_type?: string;
		master_branch?: string;
		description?: string;
		pusher_type?: string;
		commits?: Array<{
			sha: string;
			author: { email: string; name: string };
			message: string;
			distinct: boolean;
			url: string;
		}>;
		pull_request?: {
			title: string;
			html_url: string;
			body: string;
		};
		comment?: {
			body: string;
			html_url: string;
		};
		forkee?: {
			full_name: string;
			html_url: string;
		};
		[key: string]: unknown;
	};
	created_at: string;
}

export const useGithubActivity = (username: string = "ShahanM") => {
	const [events, setEvents] = useState<ActivityEvent[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const controller = new AbortController();
		const fetchEvents = async () => {
			try {
				const response = await fetch(`https://api.github.com/users/${username}/events/public`, {
					signal: controller.signal,
				});
				const data = await response.json();

				const recentEvents = data.slice(0, 18);

				if (!controller.signal.aborted) {
					setEvents(recentEvents);
				}
			} catch (error) {
				if (error instanceof Error && error.name !== "AbortError") {
					console.error("System Log Error:", error);
				}
			} finally {
				if (!controller.signal.aborted) {
					setLoading(false);
				}
			}
		};

		fetchEvents();

		return () => controller.abort();
	}, [username]);

	return { events, loading };
};

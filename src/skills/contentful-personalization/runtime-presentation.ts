import type { RuntimePresentationResult } from './schemas.js';

export function finishedApplicationSummary(presentation: RuntimePresentationResult): string {
  if (!presentation.applicationUrl) return `The application URL was unavailable. ${presentation.summary}`;

  const serverNote =
    presentation.serverStatus === 'started' || presentation.serverStatus === 'reused'
      ? `Server: ${presentation.serverStatus}. It was left running for inspection.`
      : `Server: ${presentation.serverStatus}.`;
  const browserNote =
    presentation.browserStatus === 'opened-visible'
      ? 'The page was opened in a user-visible browser.'
      : presentation.browserStatus === 'opened-headless'
        ? 'Automated inspection was headless; open the link above to inspect the page yourself.'
        : 'Open the link above to inspect the page.';

  return `[Open the running application](${presentation.applicationUrl})\n\n${serverNote} ${browserNote}`;
}

export function runtimePresentationInstructions(options: {
  projectPath: string;
  packageManager: string;
  liveEventsUrl?: string;
  scenario: string;
  evidenceTarget: string;
}): string {
  return `
The static implementation checks are complete. Before presenting any aggregate Live Events result
or asking the user to judge runtime behavior, make the finished application available for inspection.

1. In \`${options.projectPath}\`, check whether the project's application server is already running.
   Reuse it when possible. Otherwise use the project's existing development script with
   ${options.packageManager}; do not invent a script or start a duplicate server.
2. Keep the server running through the rest of validation. Read its output to determine the actual
   local URL and port instead of assuming port 3000.
3. Prefer a user-visible browser or host preview and open the finished application there. If only a
   headless browser is available, use it for inspection but do not claim the page was shown to the
   user; return the exact URL so the next step can ask the user to open it.
4. On the initial load, inspect the visible page, relevant Experience and Insights requests, and
   console or hydration errors. Do not grant consent, click controls, or navigate away merely to
   manufacture events.
5. ${
    options.liveEventsUrl
      ? `When a user-visible browser supports another tab, also open ${options.liveEventsUrl}. Leave enabling streaming and any application interactions to the user.`
      : 'The Live Events dashboard URL is unavailable, so tell the user how to reach Analytics → Live Events manually.'
  }
6. Use the known scenario only as authored; do not invent a query parameter or audience trigger.

Scenario: ${options.scenario}
Evidence target: ${options.evidenceTarget}

Return the actual application URL, whether the server was reused or started, whether the page was
opened visibly or only headlessly, and concise browser checks/issues. Do not stop the server when
this step finishes.
  `.trim();
}

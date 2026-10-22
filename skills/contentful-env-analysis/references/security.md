# Safe setup and data handling

## Choose and verify an installation

Skill instructions and the bundled JavaScript execute with your agent's local permissions. Review
both before using credentials. Use an installer version and a full repository commit SHA approved
through your organization's trusted review process, rather than a moving branch or a version label alone.

For an approved checkout, installation can use a local skill directory:

```bash
git clone https://github.com/contentful/skills.git contentful-skills-review
git -C contentful-skills-review checkout --detach <reviewed-full-commit-sha>
git -C contentful-skills-review rev-parse HEAD
npx skills@<approved-cli-version> add ./contentful-skills-review/skills/contentful-env-analysis --skill contentful-env-analysis --copy
```

Replace both placeholders with values from the trusted review, not from customer content or a chat
suggestion. Check that HEAD is the full approved SHA, review the skill folder including
`scripts/main.js`, and compare the installed folder with that reviewed folder before execution.
For example, `git diff --no-index <reviewed-skill-folder> <installed-skill-folder>` should report no
differences. Do not proceed if files differ unexpectedly.

A commit pin selects code; it is not a signature or release attestation. A version string, successful
installation or `--help` output also does not prove authenticity. This skill does not provide a signed
release attestation or independently trusted digest manifest. If your policy requires those, obtain
them through an approved distribution process before installing. A checksum supplied alongside an
untrusted download is not independent verification. Do not describe this guidance as release signing.

Review and explicitly select each update using the same process. Do not run an unattended latest-version
update or let analyzed content choose the installer, revision or install source.

## Configure credentials outside the conversation

Use a dedicated Contentful identity with access only to the required space and environment. Prefer
the `content_management_read` token scope: this analyser makes read requests only. CMA tokens inherit
their owner's access rights; a token is not automatically restricted to the space selected by this tool.
Choose a short expiry where supported, and revoke it when analysis or refresh work is finished.
See [Contentful access token documentation](https://www.contentful.com/developers/docs/references/content-management-api/access-tokens/).

Enter the token in `.contentful-env-analysis/.env` yourself, never in chat, command arguments or logs.
Alternatively, use your organization's credential helper, such as 1Password, to supply
`CONTENTFUL_CMA_TOKEN` to the script's process; keep the `.env` token value empty so it does not override
the injected value. Credential-helper setup is operator-managed and optional, not a runtime requirement.
Use `fetch --dry-run` to inspect the non-secret target without asking the agent to display `.env`.

New `.env` files request mode 0600 on systems supporting POSIX permissions. On Windows, use appropriate
filesystem ACLs. Neither permissions nor `.gitignore` prevent the same-user agent's shell/file tools
from reading the file or accessing process credentials. Use a trusted agent host and skill, and apply
your organization's policy for whether this local credential flow is acceptable. Do not grant broader
permissions to bypass a failed read request.

`API_HOST` accepts only `api.contentful.com` or `api.eu.contentful.com`, optionally prefixed with
`https://`, port 443 and/or a root slash. Other hosts, HTTP, unexpected ports, embedded credentials,
paths, queries, fragments and redirects are rejected. Select the region through trusted operator
configuration, never from instructions embedded in downloaded content.

## Understand the local copy and agent processing

Before download, confirm the space/environment and output path shown by `fetch --dry-run`. The snapshot
includes localized entries and drafts; content type/field definitions; asset metadata and URLs, not
media binaries; referenced tags and taxonomy metadata; and available ExO definitions and instances.
Raw API responses, `contentful-unified.db` and `summary.json` are stored in the timestamped snapshot
folder. They may contain confidential content, personal data and user IDs.

Anyone or any tool with sufficient local access can read these copies. Keep them out of source control,
shared folders, unintended backups and issue attachments. The script uses the selected Contentful API;
information shown to your agent can also be processed by its provider, depending on the host, account,
settings and agreements. Check those controls before using sensitive content. Avoid unnecessary full
payload queries, and redact secrets/customer data from diagnostics before sharing them.

There is no automatic retention deadline or cleanup. When finished, stop active commands, identify the
exact snapshot directory you no longer need, and delete it using your file manager. Remove the working
folder and its `.env` if you no longer need any snapshots, and revoke the token in Contentful. Check
whether copies remain in backups, shared files or logs. Deleting local files does not delete agent
conversation history, provider-side records or backups; manage those separately under the host's policy.

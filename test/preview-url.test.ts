import { describe, expect, test } from "vitest";
import { assertE2EBaseUrl } from "../e2e/base-url";
import {
  previewUrlFromComment,
  previewUrlFromComments,
  resolvePreviewUrl,
} from "../e2e/preview-url";

const head = "ca7a1405554621fee088668f462ae40f363a6eff";
const older = "2220b595554621fee088668f462ae40f363a6eff";

const successComment = `
### Preview URL: https://cursor-25ad02a0-zan-org-il.zealenu.workers.dev (commit ca7a140)
<table>
  <tbody>
    <tr>
      <td><a href="https://dash.cloudflare.com/account/builds/d81703a4">View logs</a></td>
      <td><a href="https://d81703a4-zan-org-il.zealenu.workers.dev">https://d81703a4-zan-org-il.zealenu.workers.dev</a></td>
      <td>ca7a140</td>
    </tr>
    <tr>
      <td><a href="https://dash.cloudflare.com/account/builds/2e891d28">View logs</a></td>
      <td><a href="https://2e891d28-zan-org-il.zealenu.workers.dev">https://2e891d28-zan-org-il.zealenu.workers.dev</a></td>
      <td>2220b59</td>
    </tr>
  </tbody>
</table>
`;

const failedComment = `
<!-- Preview URL -->
<table>
  <tbody>
    <tr>
      <td><ul><li><b>Build:</b> Failed</li></ul>
        <a href="https://dash.cloudflare.com/account/builds/5fab8227">View logs</a></td>
      <td></td>
      <td>4fa32f3</td>
    </tr>
  </tbody>
</table>
`;

const checkSummary = `
Build ID: [5fab8227](https://dash.cloudflare.com/77f0c1c932cf504cebd401ad4f204943/workers/services/view/zan-org-il/production/builds/5fab8227)
Script: [zan-org-il](https://dash.cloudflare.com/77f0c1c932cf504cebd401ad4f204943/workers/services/view/zan-org-il/production)
`;

describe("Cloudflare preview URL", () => {
  test("uses the deployment URL for the commit, not the branch alias or an older row", () => {
    const latest = previewUrlFromComment(successComment, head);
    const previous = previewUrlFromComment(successComment, older);
    expect(latest).toBe("https://d81703a4-zan-org-il.zealenu.workers.dev");
    expect(previous).toBe("https://2e891d28-zan-org-il.zealenu.workers.dev");
    expect(assertE2EBaseUrl(latest ?? undefined)).toBe(latest);
    expect(assertE2EBaseUrl(previous ?? undefined)).toBe(previous);
  });

  test("falls back to the alias line when that commit has no deployment cell yet", () => {
    const body = "### Preview URL: https://cursor-join-zan-org-il.zealenu.workers.dev (commit ca7a140)";
    expect(previewUrlFromComment(body, head)).toBe(
      "https://cursor-join-zan-org-il.zealenu.workers.dev",
    );
  });

  test("ignores a failed preview comment and a dashboard-only check summary", () => {
    expect(previewUrlFromComment(failedComment, "4fa32f3e3736c0c9c3ebdbb50f99503920ca9c2c")).toBeNull();
    expect(previewUrlFromComment(checkSummary, head)).toBeNull();
    expect(previewUrlFromComment(successComment, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toBeNull();
  });

  test("reads only the Cloudflare bot comment and waits until the URL is posted", async () => {
    const comments = [
      { user: { login: "someone" }, body: successComment },
      { user: { login: "cloudflare-workers-and-pages[bot]" }, body: failedComment },
    ];
    expect(previewUrlFromComments(comments, head)).toBeNull();

    let calls = 0;
    const url = await resolvePreviewUrl(
      head,
      async () => {
        calls += 1;
        if (calls < 3) return comments;
        return [{ user: { login: "cloudflare-workers-and-pages[bot]" }, body: successComment }];
      },
      async () => {},
      5,
    );
    expect(url).toBe("https://d81703a4-zan-org-il.zealenu.workers.dev");
    expect(calls).toBe(3);
  });
});

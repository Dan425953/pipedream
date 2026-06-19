import { axios } from "@pipedream/platform";

export default {
  type: "app",
  app: "rendex",
  propDefinitions: {
    html: {
      type: "string",
      label: "HTML",
      description: "The HTML markup to render to an image.",
      optional: true,
    },
    markdown: {
      type: "string",
      label: "Markdown",
      description: "Markdown to render. Rendex applies clean default typography (no CSS needed) and converts it to an image or PDF.",
      optional: true,
    },
    url: {
      type: "string",
      label: "URL",
      description: "A page URL to render (alternative to HTML). Provide either `html` or `url`.",
      optional: true,
    },
    format: {
      type: "string",
      label: "Output Format",
      description: "Output file format. Example values: `png`, `jpeg`, `webp`, or `pdf`.",
      optional: true,
      default: "png",
      options: [
        "png",
        "jpeg",
        "webp",
        "pdf",
      ],
    },
    name: {
      type: "string",
      label: "Watch Name",
      description: "Optional label for the watch, shown in the dashboard and run history.",
      optional: true,
    },
    intervalMinutes: {
      type: "integer",
      label: "Check Interval (minutes)",
      description: "How often Rendex re-checks the page, from `5` to `43200` (30 days). Defaults to `1440` (daily). Subject to your plan's minimum.",
      optional: true,
      default: 1440,
      min: 5,
      max: 43200,
    },
    diffMode: {
      type: "string",
      label: "Diff Mode",
      description: "What to compare on each check. `visual` (pixel diff), `text` (extracted-text diff), or `both`.",
      optional: true,
      default: "visual",
      options: [
        "visual",
        "text",
        "both",
      ],
    },
    threshold: {
      type: "string",
      label: "Change Threshold",
      description: "Visual-change noise floor to exceed, as a `0`–`1` fraction (e.g. `0.02` = 2%). Defaults to `0.01`. Smaller = more sensitive.",
      optional: true,
    },
    notifyEmail: {
      type: "string",
      label: "Notify Email",
      description: "Email address for change alerts. For anti-abuse, this must be your own account email; any other address is rejected.",
      optional: true,
    },
    watchId: {
      type: "string",
      label: "Watch",
      description: "The watch to act on.",
      async options() {
        const response = await this.listWatches();
        const items = response?.data?.items ?? response?.data ?? [];
        return items.map((w) => ({
          label: w.name || w.url || w.id,
          value: w.id,
        }));
      },
    },
  },
  methods: {
    _baseUrl() {
      return "https://api.rendex.dev";
    },
    _headers() {
      return {
        "Authorization": `Bearer ${this.$auth.api_key}`,
        "Content-Type": "application/json",
      };
    },
    _makeRequest({
      $ = this, path, headers, ...opts
    }) {
      return axios($, {
        url: `${this._baseUrl()}${path}`,
        headers: {
          ...this._headers(),
          ...headers,
        },
        ...opts,
      });
    },
    /**
     * Render HTML, Markdown, or a URL to an image/PDF via POST /v1/screenshot/json.
     * @param {object} opts - axios options; `data` is the JSON request body.
     * @returns {Promise<object>} `{ success, data: { image, format, bytesSize, ... }, meta }`
     */
    renderJson(opts = {}) {
      return this._makeRequest({
        method: "POST",
        path: "/v1/screenshot/json",
        ...opts,
      });
    },
    /**
     * Create a website watch via POST /v1/watches (captures a baseline now).
     * @param {object} opts - axios options; `data` is the JSON request body.
     * @returns {Promise<object>} `{ data: { id, url, intervalMinutes, diffMode, status, ... } }`
     */
    createWatch(opts = {}) {
      return this._makeRequest({
        method: "POST",
        path: "/v1/watches",
        ...opts,
      });
    },
    /**
     * Run an immediate check on a watch via POST /v1/watches/:id/run (charges 1 credit).
     * @param {object} opts - axios options; `watchId` is the watch to run.
     * @returns {Promise<object>} The run result.
     */
    runWatchNow({
      watchId, ...opts
    } = {}) {
      return this._makeRequest({
        method: "POST",
        path: `/v1/watches/${watchId}/run`,
        ...opts,
      });
    },
    /**
     * List the account's watches via GET /v1/watches.
     * @returns {Promise<object>} `{ data: { items: [...] } }`
     */
    listWatches(opts = {}) {
      return this._makeRequest({
        method: "GET",
        path: "/v1/watches",
        ...opts,
      });
    },
    /**
     * Fetch a watch's run history via GET /v1/watches/:id/runs (newest first).
     * @param {object} opts - axios options; `watchId` is the watch to read.
     * @returns {Promise<object>} `{ data: { items: [{ changed, diffScore, beforeUrl, afterUrl, diffOverlayUrl, ... }] } }`
     */
    listWatchRuns({
      watchId, ...opts
    } = {}) {
      return this._makeRequest({
        method: "GET",
        path: `/v1/watches/${watchId}/runs`,
        ...opts,
      });
    },
  },
};

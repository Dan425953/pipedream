import { ConfigurationError } from "@pipedream/platform";
import rendex from "../../rendex.app.mjs";

export default {
  key: "rendex-create-watch",
  name: "Create Watch",
  description: "Start monitoring a page for changes with Rendex Watch — it captures a baseline now, then re-checks on a schedule and flags visual/text changes. [See the documentation](https://rendex.dev/docs/watch).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    rendex,
    url: {
      propDefinition: [
        rendex,
        "url",
      ],
      description: "The page URL to monitor for changes.",
    },
    name: {
      propDefinition: [
        rendex,
        "name",
      ],
    },
    intervalMinutes: {
      propDefinition: [
        rendex,
        "intervalMinutes",
      ],
    },
    diffMode: {
      propDefinition: [
        rendex,
        "diffMode",
      ],
    },
    threshold: {
      propDefinition: [
        rendex,
        "threshold",
      ],
    },
    notifyEmail: {
      propDefinition: [
        rendex,
        "notifyEmail",
      ],
    },
  },
  async run({ $ }) {
    if (!this.url) {
      throw new ConfigurationError("`url` is required.");
    }

    let threshold;
    if (this.threshold != null && `${this.threshold}`.trim() !== "") {
      threshold = Number(this.threshold);
      if (Number.isNaN(threshold) || threshold < 0 || threshold > 1) {
        throw new ConfigurationError("`threshold` must be a number between 0 and 1.");
      }
    }

    const data = {
      url: this.url,
      ...(this.name && { name: this.name }),
      ...(this.intervalMinutes && { intervalMinutes: this.intervalMinutes }),
      ...(this.diffMode && { diffMode: this.diffMode }),
      ...(threshold !== undefined && { threshold }),
      ...(this.notifyEmail && { notifyEmail: this.notifyEmail }),
    };

    const response = await this.rendex.createWatch({
      $,
      data,
    });

    const result = response.data ?? response;
    $.export("$summary", `Created watch${result?.id ? ` ${result.id}` : ""} on ${this.url}`);
    return result;
  },
};

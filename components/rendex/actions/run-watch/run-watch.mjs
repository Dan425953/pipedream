import rendex from "../../rendex.app.mjs";

export default {
  key: "rendex-run-watch",
  name: "Run a Check Now",
  description: "Trigger an immediate check on an existing Rendex Watch instead of waiting for its schedule (charges 1 credit; a failed check is refunded). [See the documentation](https://rendex.dev/docs/watch).",
  version: "0.0.1",
  type: "action",
  annotations: {
    destructiveHint: false,
    openWorldHint: true,
    readOnlyHint: false,
  },
  props: {
    rendex,
    watchId: {
      propDefinition: [
        rendex,
        "watchId",
      ],
    },
  },
  async run({ $ }) {
    const response = await this.rendex.runWatchNow({
      $,
      watchId: this.watchId,
    });

    const result = response.data ?? response;
    $.export("$summary", `Ran a check on watch ${this.watchId}`);
    return result;
  },
};

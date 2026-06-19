import { DEFAULT_POLLING_SOURCE_TIMER_INTERVAL } from "@pipedream/platform";
import rendex from "../../rendex.app.mjs";
import sampleEmit from "./test-event.mjs";

export default {
  key: "rendex-new-change-detected",
  name: "New Change Detected",
  description: "Emit an event each time a Rendex Watch detects a change on the page it monitors — includes the before/after/overlay image URLs and the diff score. [See the documentation](https://rendex.dev/docs/watch).",
  version: "0.0.1",
  type: "source",
  dedupe: "unique",
  props: {
    rendex,
    db: "$.service.db",
    timer: {
      type: "$.interface.timer",
      label: "Polling Schedule",
      description: "How often to check the watch's run history for new changes.",
      default: {
        intervalSeconds: DEFAULT_POLLING_SOURCE_TIMER_INTERVAL,
      },
    },
    watchId: {
      propDefinition: [
        rendex,
        "watchId",
      ],
      description: "The watch to emit change events for. Create one with the **Create Watch** action or in your Rendex dashboard.",
    },
  },
  methods: {
    _getLastTs() {
      return this.db.get("lastTs") || 0;
    },
    _setLastTs(ts) {
      this.db.set("lastTs", ts);
    },
    _runTs(run) {
      return Date.parse(run.completedAt || run.createdAt || "") || 0;
    },
    generateMeta(run) {
      const pct = run.diffScore != null
        ? `${(run.diffScore * 100).toFixed(1)}% changed`
        : "changed";
      return {
        id: run.runId || run.id,
        summary: `Change detected (${pct})`,
        ts: this._runTs(run) || Date.now(),
      };
    },
  },
  async run() {
    const lastTs = this._getLastTs();

    const response = await this.rendex.listWatchRuns({
      watchId: this.watchId,
    });
    const runs = response?.data?.items ?? response?.data ?? [];

    const fresh = runs
      .filter((run) => run.changed && this._runTs(run) > lastTs)
      .sort((a, b) => this._runTs(a) - this._runTs(b));

    let maxTs = lastTs;
    for (const run of fresh) {
      this.$emit(run, this.generateMeta(run));
      maxTs = Math.max(maxTs, this._runTs(run));
    }

    if (maxTs > lastTs) {
      this._setLastTs(maxTs);
    }
  },
  sampleEmit,
};

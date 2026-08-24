/**
 * Serialises admin writes.
 *
 * Ids are generated client-side, so the UI happily creates a question and accepts
 * a part inside it before the question's INSERT has resolved. Dispatched
 * concurrently, the child can reach Postgres first and fail with 23503
 * foreign_key_violation. Everything therefore goes through one FIFO chain.
 */
/** A write the queue dropped on purpose. Callers must not report these as errors. */
export class CancelledMutation extends Error {}

export interface Enqueued {
  /** Ancestry, root-first: [testId, questionId, partId, stepId, hintId]. */
  scope: string[];
  run: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

export class MutationQueue {
  private pending: Enqueued[] = [];
  private draining = false;
  private idle: Promise<void> = Promise.resolve();
  private signalIdle: () => void = () => {};

  /** Discards queued work under `scope` — a delete makes those writes unrunnable. */
  prune(scope: string[]) {
    const target = scope[scope.length - 1];
    this.pending = this.pending.filter((entry) => {
      if (!entry.scope.includes(target)) return true;
      entry.reject(new CancelledMutation("an ancestor was deleted"));
      return false;
    });
  }

  enqueue<T>(scope: string[], run: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.pending.push({
        scope,
        run,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.drain();
    });
  }

  /** Resolves once nothing is queued, whether the queue emptied or failed. */
  whenIdle(): Promise<void> {
    return this.idle;
  }

  private drain() {
    if (this.draining) return;
    this.draining = true;
    this.idle = new Promise((done) => (this.signalIdle = done));

    void (async () => {
      while (this.pending.length) {
        const entry = this.pending.shift()!;
        try {
          entry.resolve(await entry.run());
        } catch (error) {
          entry.reject(error);
          this.failFast(error);
          break;
        }
      }
      this.draining = false;
      this.signalIdle();
    })();
  }

  /**
   * A failed write means everything behind it is suspect: children whose parent
   * never landed would cascade more rejections, and their late responses could
   * overwrite the clean state the caller's refetch is about to install.
   */
  private failFast(error: unknown) {
    const cancelled = this.pending;
    this.pending = [];
    for (const entry of cancelled) {
      // The write that actually failed already surfaced its own error; these are
      // collateral, so they stay quiet rather than raising N more.
      entry.reject(new CancelledMutation(`an earlier write failed (${String(error)})`));
    }
  }
}

import { describe, it, expect } from "vitest";
import { MutationQueue } from "../mutation-queue";

const deferred = () => {
  let resolve!: () => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res as () => void;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe("MutationQueue", () => {
  it("dispatches a child only after its parent resolves", async () => {
    const queue = new MutationQueue();
    const parent = deferred();
    const order: string[] = [];

    const parentWrite = queue.enqueue(["test", "question"], async () => {
      order.push("parent:start");
      await parent.promise;
      order.push("parent:done");
    });
    const childWrite = queue.enqueue(["test", "question", "part"], async () => {
      order.push("child:start");
    });

    await Promise.resolve();
    expect(order).toEqual(["parent:start"]);

    parent.resolve();
    await Promise.all([parentWrite, childWrite]);

    expect(order).toEqual(["parent:start", "parent:done", "child:start"]);
  });

  it("prunes queued descendants when an ancestor is deleted", async () => {
    const queue = new MutationQueue();
    const blocker = deferred();
    const dispatched: string[] = [];

    const blocking = queue.enqueue(["other"], async () => {
      await blocker.promise;
    });
    const orphaned = queue.enqueue(["test", "question", "part"], async () => {
      dispatched.push("part");
    });
    const unrelated = queue.enqueue(["test", "sibling"], async () => {
      dispatched.push("sibling");
    });

    queue.prune(["test", "question"]);
    await expect(orphaned).rejects.toThrow(/ancestor was deleted/);

    blocker.resolve();
    await Promise.all([blocking, unrelated]);

    expect(dispatched).toEqual(["sibling"]);
  });

  it("prunes descendants many levels below the deleted row", async () => {
    const queue = new MutationQueue();
    const blocker = deferred();
    const blocking = queue.enqueue(["other"], () => blocker.promise);

    const hint = queue.enqueue(["test", "question", "part", "step", "hint"], async () => {
      throw new Error("should never dispatch");
    });

    queue.prune(["test"]);
    await expect(hint).rejects.toThrow(/ancestor was deleted/);

    blocker.resolve();
    await blocking;
  });

  it("fails fast: a rejected write cancels everything behind it", async () => {
    const queue = new MutationQueue();
    const dispatched: string[] = [];

    const failing = queue.enqueue(["a"], async () => {
      throw new Error("boom");
    });
    const queued = queue.enqueue(["b"], async () => {
      dispatched.push("b");
    });

    await expect(failing).rejects.toThrow("boom");
    await expect(queued).rejects.toThrow(/an earlier write failed/);
    expect(dispatched).toEqual([]);
  });

  it("keeps accepting work after a failure drains the queue", async () => {
    const queue = new MutationQueue();

    await expect(
      queue.enqueue(["a"], async () => {
        throw new Error("boom");
      })
    ).rejects.toThrow("boom");

    await expect(queue.enqueue(["b"], async () => "recovered")).resolves.toBe(
      "recovered"
    );
  });

  it("whenIdle resolves once the queue empties", async () => {
    const queue = new MutationQueue();
    const gate = deferred();
    const write = queue.enqueue(["a"], () => gate.promise);

    let idle = false;
    void queue.whenIdle().then(() => (idle = true));

    expect(idle).toBe(false);
    gate.resolve();
    await write;
    await queue.whenIdle();
    expect(idle).toBe(true);
  });
});

# Browser delivery postcondition

Contract `tse-family-learning.browser-delivery.v1` owns the product oracle for
TFL-LEARNER, TFL-PRACTICE and TFL-PROGRESS. Apps admits exact target context;
Hands runs this image; provider observation binds the target runtime. This
runner checks actual browser behavior and does not substitute HTTP health.

Required assertion IDs, in order:
- `learner.activity-completed`: generic Learner 2 completes the governed
  three-question Phonics/Foundation/Sound patterns activity with answer
  feedback and a saved 3/3 result.
- `learner.history-survives-reload`: reload restores the identical local
  result and displays it in history; retained history is bounded to eight.
- `learner.history-isolated`: switching to Learner 1 shows empty history,
  returning to Learner 2 restores its unchanged result.

Every admitted target is checked in its own disposable browser context.
Assertions pass only if all targets pass. Requests outside each selected
origin are blocked, including redirect destinations. Context close removes
all synthetic learner data; no server account or persistent remote writes
exist. This is local profile separation, not authentication or child privacy.
Offline continuity and full history overflow tests remain the existing mobile
suite, not claims made by these assertions.

Input is the canonical Apps `APPS_PRODUCT_PROBE_CONTEXT` JSON and matching
`APPS_PRODUCT_PROBE_CONTEXT_DIGEST` SHA-256 over JCS. Result is written to
`/dev/termination-log` within 4096 bytes with contextDigest, every exact
required assertion, startedAt and finishedAt. Failed prerequisites leave
unexecuted assertions SKIPPED. Exit status does not replace the receipt.

Build `Dockerfile.product-probe` from the accepted repository source using the
normal Apps build authority and use its resulting immutable image digest as
runnerImageDigest. No new CI publisher or alternate registry writer is added.
Local browser execution proves candidate behavior only. Root release admission,
normal image build and deploy, per-target runtime observation, fault recovery,
performance and soak remain separate delivery evidence.

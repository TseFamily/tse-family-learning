# LearningQuest product vision

## Destination

LearningQuest is a family learning PWA for children and adults who share a
browser or device. It turns a learner's stage, goal, and recent practice into
one clear next activity, gives immediate teaching feedback, and keeps enough
local history for the learner or a family coach to choose what to practise
next.

The product name is LearningQuest. The Tse Family organisation and this
repository host it; they are not a second product or a second destination.

The product is broader than the school-prep quiz from which it grew, but it is
not a generic catalogue of promised subjects. A learning path exists only when
checked-in question or content-pack data drives a usable activity. The shared
concept is a short practice loop:

```text
choose learner and purpose -> practise -> understand the response
-> preserve local evidence -> choose the next practice
```

School preparation, language recall, foundational maths, and adult exam
practice deepen that loop through different validated content shapes. They do
not create separate products or make one school, exam, or family the reusable
default.

## People and jobs

- **Learner:** start a suitable, touch-friendly practice session, understand
  each response, and return to recent progress without a long setup path.
- **Parent or family coach:** review the histories saved for the generic local
  learner profiles and open a suggested follow-up activity on the same
  browser.
- **Content maintainer:** add or revise a learning pack through the registry,
  pack schema, runtime validation, and activity surface without embedding one
  learner's private context in product code.

## Family and data boundary

LearningQuest's shipped continuity is browser-local. Learner selection and
practice history use local browser storage; the static application has no
account, remote progress writer, public profile, chat, or social-sharing path.
Progress moves between browsers only through an explicit JSON export and
import selected by the person using the device. That transfer is a manual
backup, not cloud sync or conflict-resolved multi-device state.

The default learner identities remain generic, and private family names or a
school-specific promise must not become reusable UI defaults. The same-browser
coach overview is convenience, not authentication or a protected parent area:
any person with access to that browser can switch profiles and inspect its
saved views. Child privacy or parental access control must therefore never be
claimed from this local profile separation alone.

## Product oracle

The destination is present when, on one supported browser, a person can:

1. open the responsive LearningQuest shell and choose a generic local learner,
   stage, and goal;
2. receive a mission and curriculum recommendation backed by an available
   checked-in question bank or validated content pack;
3. complete the selected practice with immediate answer feedback and an
   understandable result (practice facts such as correct/total and percent,
   not an official exam pass);
4. see the result restored under the selected learner and used for a next-step
   or same-browser coach action; and
5. after a successful service-worker installation, reopen the cached core app
   and content without a network, while retaining the option to transfer
   bounded progress through explicit export and import.

The oracle fails if a planned curriculum card is presented as an activity, an
optional pack outage disables unrelated question practice, histories cross
local learner keys, private family identity becomes product data, local
storage/export is described as protected identity or automatic sync, or a
pass-target, PASSED/Not-yet, or official-exam-readiness claim is sold as
proof of learning.

The durable identities, their fates, and exact failure oracles are in
[the identity graph](capabilities.md). Source, check, deployed artifact, and
live observations remain separate evidence layers.

## Non-goals

- A school admissions authority, school-specific guarantee, or official exam
  content source.
- A learning-management system, remote learner identity provider, cloud
  progress service, or automatic multi-device sync engine.
- Public profiles, public leaderboards, messaging, social sharing, ads,
  purchases, or a child-directed community.
- Treating roadmap copy, a curriculum placeholder, CI, a deployment record, or
  a reachable URL as proof that a learning activity or whole journey works.

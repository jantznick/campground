# Questions for Clarification

Please find below a list of questions to help clarify some requirements.

1.  **Database ORM/Toolkit:** In `docs/technical.md`, I've suggested using either Prisma (an ORM) or Kysely (a type-safe query builder) for database interactions with PostgreSQL. Do you have a preference? If not, I will proceed with **Prisma** as it provides a good balance of features for schema management, migrations, and type-safe queries.
This is correct: Prisma is in use.

2.  **UI Component Library:** The rules specify using Headless UI. This provides excellent unstyled, accessible components. For more complex elements, should I:
    a) Build custom components from scratch using Headless UI and Tailwind CSS?
    b) Use a library like **Catalyst** by the Tailwind CSS team, which is built on top of Headless UI and provides a more extensive set of pre-designed components?
    (I recommend **Option B** for faster development, but either is a great choice).
Option B is fine, but I'd like to not use too many external packages and libraries if possible.

3.  **Organization "Hidden" Feature:** The `readme.md` states, "Organizations will be hidden unless it's toggled to on via settings." How should this be interpreted?
    a) A user who signs up without an invite creates an `Organization` and a `Company` inside it, but the UI only shows them the `Company` level and below. The `Organization` is conceptually hidden.
    b) The system has two modes: a simple mode (Company -> Team -> Project) and an "enterprise" mode (Org -> Company -> Team -> Project) that can be enabled.
    (I believe **Option A** is more aligned with the multi-tenant boilerplate goal, where the top-level tenant always exists but might be abstracted away for simplicity. Please confirm.)
Yes, Option A is correct. This will give them more flexibility to create more companies at a later date.

4.  **Editor Role Permissions:** The `readme.md` says, "Editors can not edit their highest most hierarchy options." Let's take the example of a user who is an "Editor" of a `Company`. Does this mean they:
    a) Cannot edit the `Company`'s own settings (like its name or description)?
    b) Cannot perform actions on the `Organization` that contains the `Company`?
    (I assume it's **Option A**, preventing them from modifying the "container" they are an editor of. Please confirm.) 
Yes exactly, it is Option A. They can not edit the company's own settings. Additionally they can not perform any actions on the parent container being the organization.
We are creating a webapp boilerplate for creating multi-tenant web applications.
AI Agent Developers should follow the rules in .cursor/rules/rules.mdc

The application should use the following color palette: --prussian-blue: #003049ff; --fire-engine-red: #d62828ff; --orange-wheel: #f77f00ff; --xanthous: #fcbf49ff; --vanilla: #eae2b7ff;

The application should have the following multi-tenant hierarchy: Organizations(Org) -> Companies(Company) -> Teams(Team) -> Projects(Project)

Be default Organizations will be hidden unless it's toggled to on via settings.

For user roles to start the following user roles should exist:

Admin: Able to do anything at the given hierarchy level and below
Editor: Able to do anything at the given hierarchy level and below. Except: Editors can not edit their highest most hierarchy options. Example: If someone is an editor of a company they can edit anything within a company, but not the company settings such as name, description, etc...
Reader: Can read anything at their given hierarchy level and below.
Users can have multiple roles across the various hierarchy levels.

There should be a middleware created that verifies users are able to access/edit the right information via page loads or API calls.

When registering a user is given the ability to enter an invite token(in the form of a UUID), by entering this invite token they will be given immediate access to the permissions that invite token was previously set up with. The registration page should also check for an invite token as a url param so at a later date the ability to send invite emails exists.

If there's not an invite token then the user will be creating a brand new Organization.
# Experience Orchestration entities

Experience Orchestration (ExO) adds presentation-aware schema and instances alongside a Contentful content model.

- An **Experience Template** is the schema for an Experience. It declares the page-level content properties, design properties, and slots available to authors.
- An **Experience** is an authored instance of an Experience Template.
- A **Component** is reusable presentation schema. A coded Component is implemented in application code. A composite Component has a stored component tree.
- A **Fragment** is an authored reusable instance based on a Component.
- A **Data Assembly** describes how content is assembled for ExO entities.
- A **content property** accepts content or a binding to content. A **design property** controls presentation values. A **slot** accepts nested Components or Fragments.

The snapshot records only the entities returned by the selected space and environment. A zero count may mean there are no entities, while an `unavailable` collection in `summary.json` means the API could not be read and must not be described as zero.

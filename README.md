libraries_of_interest
=====================

Collects all 'submodules of interest': we use these directly or as inspirational sources. Includes scripts to 'prep &amp; install' the libraries that we actually use in our production environment so that merely loading *this* submodule gets you all the files you need in a full-fledged Visyond production environment. Has a long list of submodules.


What library source code should I use?
--------------------------------------

The `_` directory tree is where we keep the 'active instances' of the libraries we actually *use*
right now.

The rules are simple: 

- when you need a library, fetch it from the `_` directory in this repository. 

  That way you will always use the latest library revisions which will
  also be used for the next release.

- **iff** you *temporarily* need a very specific revision of a library, you should create
  a `git branch` and store your specific library edits in the `_` directory tree there.

  This allows us to easily compare and merge branches into the master timeline where necessary.


What about the `_` directory?
-----------------------------

The `_` library directory tree contains fresh instances of each library which we use
in any of our applications / projects:

The goal of the `_` directory tree is to store direct copies of the libraries we use, cleaned of
all 'cruft', i.e. all documentation, examples, build scripting, etc. files which are not required
for *using* a library have been removed.

The goal of the `_` directory tree is to give every developer (and production server node) access
to the library sources we require in any of our projects without having to initialize the
library submodules: everything we need is contained in this library repository.


### The contents of the `_` directory tree

These library files are preprocessed/cleaned copies of the libraries referenced in this repository
by `git submodule`.

These library copies have been cleaned i.e. stripped of any example code, documentation files and
other surplus not required for *using* the library sources in either development or production.

Before these library files may be used in production, they should be *postprocessed* by the
regular fingerprint+compression process: those results should then be stored in the release
'snapshots' repository by the release construction tools.

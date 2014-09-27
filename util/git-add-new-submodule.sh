#! /bin/bash
#

curdir=$( pwd )
# http://stackoverflow.com/questions/3572030/bash-script-absolute-path-with-osx/3572105#3572105
realpath() {
    [[ $1 = /* ]] && echo "$1" || echo "$curdir/${1#./}"
}

# How to obtain the default repository owner?
# -------------------------------------------
# 
# 1. extract the name of the owner of the repository your currently standing in
# 2. if that doesn't work, get the locally configured github user as set up in the git repository you're standing in
# 3. if that doesn't work, get the local system globally configured github user
# 4. okay, nothing works. So you must be GerHobbelt on a fresh machine, right?
# 
# Note: the RE is engineered to eat ANYTHING and only extract username from legal git r/w repository URLs (git@github.com:user/repo.git)
# Note: this RE should work with BSD/OSX sed too:  http://stackoverflow.com/questions/12178924/os-x-sed-e-doesnt-accept-extended-regular-expressions
repoOwner=$( git config --get remote.origin.url | sed -E -e 's/^[^:]+(:([^\/]+)\/)?.*$/\2/' )
if test -z $repoOwner ; then
    repoOwner=$( git config --get github.user )
    if test -z $repoOwner ; then
        repoOwner=$( git config --global --get github.user )
        if test -z "$repoOwner"; then
            repoOwner=GerHobbelt
        fi
    fi
fi


pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null
cd ..

if test -z "$2" ; then
    cat <<EOT
$0 <repo-name> <destination-directory> [<original-author> [<forks>]]

Add a NEW submodule to the set of submodules.

Also adds the <username>-original remote reference to this submodule.

When any fork names (github users) are listed, these are added as
additional repository remotes.

Instead of the <forks> you can specify a JSON file as obtained raw 
from github by specifying its elative or absolute path: it is recognized
as a path just as long as you make sure there's at least one slash '/'
in it.

<repo-name> can be any of these formats:

  repo-name
  repo-owner/repo-name
  git@github.or.else.com:repo-owner/repo-name
  git://github.com/repo-owner/repo-name

where 'repo-owner' is the remote owner (default: '$repoOwner') which owns
the remote repository from which you clone; the 'repo-owner' will also be the
target for any 'git push'.

Example usage:

     util/git_add_submodule.sh jasmine-ui lib/jasmine-ui tigbro
     util/git_add_submodule.sh jasmine-ui lib/jasmine-ui tigbro @./network_meta

  which will register the git@github.com:$repoOwner/jasmine-ui.git remote repository as a git
  submodule in the local directory lib/jasmine-ui, while git@github.com:tigbro/jasmine-ui.git
  is registered as the original author git-remote (and any forks listed in the github
  metadata file found in ./network_meta are registered as git remotes as well): this allows
  us to easily sync/update our fork/clone from the original and other forks using a simple
  'git pull --all' command (or even easier: by running the git_pull_push.sh script).
  
EOT
    exit 0;
fi

repo=$( echo $1 | sed -e 's/.*\///' -e 's/\.git$//' )
githubowner=$( echo /$1 | sed -e 's/\/.*//' -e 's/.*://' -e 's/.*\///' )
giturl=$1
dstdir=$2
author=$3

# check if the specified repository is a git URL or simply a repo name: in the latter case the URL is constructed for you.
#
# http://askubuntu.com/questions/299710/how-to-determine-if-a-string-is-a-substring-of-another-in-bash
echo  test "${giturl/:}" = "$giturl"
if test "${giturl/:}" = "$giturl" ; then
    if test -z $githubowner ; then
        githubowner=$repoOwner
    fi
    giturl=git@github.com:$githubowner/$repo.git
fi

    cat <<EOT
-------------------------------------------------------------------------------------------
Registering as a git submodule:
  $repo

We assume this (git/github) URL points at the remote repository which will (a) be cloned,
and (b) be referenced as the default 'git push' remote, so you'ld better have collaborator
or owner rights there, buddy! ('git push' directly or via the 'git_pull_push.sh' script...)
  
  url =         $giturl
  owner =       $githubowner
  destination = $dstdir 
-------------------------------------------------------------------------------------------
EOT

if test -d $dstdir ; then
    cat <<EOT

### WARNING ###

Destination directory [$dstdir] already exists. 
Cannot clone a submodule into an existing directory!

Instead, we'll register the listed 'original author' and further remotes ('forks')
with the existing repository.
-------------------------------------------------------------------------------------------
EOT
fi

echo "(Press ENTER to continue...)";
read;

git submodule add $giturl $dstdir

cd $dstdir

if test -n "$author" ; then
    git remote add ${author}-original git://github.com/$author/$repo.git

    # add additional forks as remotes:
    shift 3

    while test -n "$1" ; do
        author=$1
        # http://askubuntu.com/questions/299710/how-to-determine-if-a-string-is-a-substring-of-another-in-bash
        if test "${1/\/}" = "$1" ; then
            git remote add ${author} git://github.com/$author/$repo.git
        else
            # network_meta file from github
            networkmeta=$( realpath "$1" )
            echo "*** networkmeta JSON file:   $networkmeta ***"
            # http://unix.stackexchange.com/questions/41232/loop-through-tab-delineated-file-in-bash-script
            # This code requires `npm install json -g` (jsontools: http://trentm.com/json/ )
            cat $networkmeta | json users | json -a name repo | while read author clonename ; do
                git remote add ${author} git://github.com/$author/$clonename.git
            done
        fi
        shift
    done
fi

git pull --all
git fetch --tags


popd                                                                                                    2> /dev/null  > /dev/null

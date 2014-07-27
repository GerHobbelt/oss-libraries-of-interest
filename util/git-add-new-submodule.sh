#! /bin/bash
#

curdir=$( pwd )
# http://stackoverflow.com/questions/3572030/bash-script-absolute-path-with-osx/3572105#3572105
realpath() {
    [[ $1 = /* ]] && echo "$1" || echo "$curdir/${1#./}"
}


pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null
cd ..

if test -z "$2" ; then
    cat <<EOT
$0 <repo-name> <destination-directory> <original-author> [<forks>]

Add a NEW submodule to the set of submodules.

Also adds the <username>-original remote reference to this submodule.

When any fork names (github users) are listed, these are added as
additional repository remotes.

Instead of the <forks> you can specify a JSON file as obtained raw 
from github by specifying its elative or absolute path: it is recognized
as a path just as long as you make sure there's at least one slash '/'
in it.

Example usage:
   util/git_add_submodule.sh jasmine-ui lib/jasmine-ui tigbro
   util/git_add_submodule.sh jasmine-ui lib/jasmine-ui tigbro @./network_meta

EOT
    exit 0;
fi

repo=$1
dstdir=$2
author=$3

if test -d $dstdir ; then
    echo "Destination directory [$dstdir] already exists. Cannot clone a submodule into an existing directory!";
    echo "(Press ENTER to continue...)";
    read;
fi

git submodule add git@github.com:GerHobbelt/$repo.git $dstdir

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

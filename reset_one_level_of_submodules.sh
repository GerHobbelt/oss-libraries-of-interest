#! /bin/bash
#
#
#

pushd .     > /dev/null

if test -d "$1" ; then
	cd "$1"
elif test -f "$1" ; then
	cd "$( dirname "$1" )"
fi
	
PRJDIR="$( pwd )"

cd "$( dirname "$0" )"

BASEDIR="$( pwd )"

cd "$PRJDIR"

cat <<EOL
BASE: $BASEDIR
PRJ:  $PRJDIR
EOL

while true; do
	if test "$PRJDIR" = "$BASEDIR" ; then
		cat <<EOL

>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
ERROR: Ignoring erroneous switch to subdirectory/submodule: $1
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

EOL
		break; # goto end
	fi

	if ! test -e "$PRJDIR/.git" ; then
		cat <<EOL

>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
ERROR: Not a valid git (sub)repo in subdirectory/submodule: $1
<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

EOL
		break; # goto end
	fi

	# do the actual work now that we've checked every eventuality:
	git reset --hard
	if test -f ".gitmodules" ; then
		git submodule sync
	fi

	# done:
	break
done


# :end
popd     > /dev/null




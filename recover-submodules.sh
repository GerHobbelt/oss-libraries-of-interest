#! /bin/bash

#for f in $( find . -maxdepth 6 -type f -name '.git' ) ; do
f=$1
echo "f=$f"
	bp=$( echo $f | sed -e 's/\/\.git$//' -e 's/^\.\/lib\///' )
	echo "bp=$bp"
	if test -f ../.git/modules/lib/modules/$bp/config ; then
		url=$( grep -e '"origin"' -A3  ../.git/modules/lib/modules/$bp/config | grep -e 'url\s*=' | sed -E -e 's/\surl\s*=\s*//' )
		echo "url=$url"

		echo "		git_submod_add   $url                                   $bp" >> ./util/git_add_submodule_references.sh
	else
		echo "### CANNOT FIND GIT CONFIG for $bp"
	fi
#done

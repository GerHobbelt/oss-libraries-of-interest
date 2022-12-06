#! /bin/bash
#

for f in $( cat github-repo-list.txt ); do
	echo " "
	#echo $f;

	# git@github.com:GerHobbelt/qiqqa-revengin.git
	repo=$( echo $f | sed -e 's/https:\/\/github.com/git@github.com:/' -e 's/$/.git/' )
	name=$( basename $repo | sed -e 's/\.git$//' )

	echo "Cloning $repo locally to directory '$name' ???"
	if [ -e $name/.git ] ; then
		echo "Repo already has been filled: updating repo from remote..."

		# update repo from remote
		cd $name
		/w/Projects/sites/library.visyond.gov/80/util/git_pull_push.sh -p
		cd ..
	else
		echo "Cloning new repo..."
		
		git clone $repo
	fi
	
done

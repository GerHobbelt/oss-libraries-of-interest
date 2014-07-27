#! /bin/bash
#
# make sure all library JS files (in /lib/_/ ) are postfixed with the loadcheck code
# from `/visyond_javascript_file_postfix.ascii` to ensure that all loaded files are
# checked for proper loading in the Visyond pages.

pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null


# go to the lib directory of project
cd ../lib/_

for f in $( grep -L -e 'visyond_file_counter' $( find . -type f -name '*.js' ) ) ; do
    echo "*** patching file $f ***"
    cat $f ../../util/visyond_javascript_file_postfix.ascii > tmp.bak
    mv tmp.bak $f
done

# go to the parser directory of project
cd ../../parser

for f in $( grep -L -e 'visyond_file_counter' $( find . -type f -name '*.js' ) ) ; do
    echo "*** patching file $f ***"
    cat $f ../util/visyond_javascript_file_postfix.ascii > tmp.bak
    mv tmp.bak $f
done

# go to the js directory of project
cd ../js

for f in $( grep -L -e 'visyond_file_counter' $( find . -type f -name '*.js' ) ) ; do
    echo "*** patching file $f ***"
    cat $f ../util/visyond_javascript_file_postfix.ascii > tmp.bak
    mv tmp.bak $f
done

# go to the yii::js directory of project
cd ..
if test -d yii/visyond/js ; then
    cd yii/visyond/js

    for f in $( grep -L -e 'visyond_file_counter' $( find . -type f -name '*.js' ) ) ; do
        echo "*** patching file $f ***"
        cat $f ../../../util/visyond_javascript_file_postfix.ascii > tmp.bak
        mv tmp.bak $f
    done

    cd ../../..
fi

# go to the yii::js directory of framework
if test -d yii/framework/web/js/source ; then
    cd yii/framework/web/js/source

    for f in $( grep -L -e 'visyond_file_counter' $( find . -type f -name '*.js' ) ) ; do
        echo "*** patching file $f ***"
        cat $f ../../../../../util/visyond_javascript_file_postfix.ascii > tmp.bak
        mv tmp.bak $f
    done

    cd ../../../../..
fi

popd                                                                                                    2> /dev/null  > /dev/null

#! /bin/bash
#
# checkout all submodules to their desired 'HEAD' bleeding edge revision: MASTER for most.
#

pushd $(dirname $0)                                                                                     2> /dev/null  > /dev/null

cd ..



getopts ":Fhl" opt
#echo opt+arg = "$opt$OPTARG"
case "$opt$OPTARG" in
"F" )
  echo "--- checkout to branch or master with RESET + FORCE ---"
  mode="F"
  for (( i=OPTIND; i > 1; i-- )) do
    shift
  done
  #echo args: $@
  ;;

"h" )
  mode="?"
  cat <<EOT
$0 [-F] [-l]

checkout git submodules to the preconfigured branch (master / other).

-F       : apply 'git reset --hard' and 'git checkout --force' to each submodule

-l       : list the submodules which will be checked out to a non-'master' branch

EOT
  exit
  ;;

"l" )
  mode="?"
  cat <<EOT

These submodules have been preconfigured to checkout to non-master branches:

EOT
  ;;

* )
  echo "--- checkout git submodules to master / branch ---"
  mode="R"
  ;;
esac




#git submodule foreach --recursive git checkout master
#
# instead, use the shell to loop through the submodules so we can give any checkout errors the birdy!
if test "$mode" != "?" ; then
    for f in $( git submodule foreach --recursive --quiet pwd ) ; do
        pushd $f                                                                                            2> /dev/null  > /dev/null
        case "$mode" in
F )
            echo "submodule: $f (master, FORCED)"
            git reset --hard
            git checkout master --force
            git reset --hard
      ;;

"?" )
            ;;

R )
            echo "submodule: $f (master)"
            git checkout master
            ;;
        esac
        popd                                                                                                2> /dev/null  > /dev/null
    done
fi

# args: lib localname remote
function checkout_branch {
    if test -d $1 ; then
        pushd $1                                                                                                2> /dev/null  > /dev/null
        case "$mode" in
F )
            echo "submodule: $1, branch: $2 (FORCED)"
            git branch --track $2 origin/$2                                                                            2> /dev/null
            git reset --hard
            git checkout $2 $3 --force
            git reset --hard
            ;;

"?" )
            if test "$2" != "master"; then
                echo "submodule: $1"
                echo "                                         branch: $2"
            fi
            ;;

R )
            echo "submodule: $1, branch: $2"
            git branch --track $2 origin/$2                                                                            2> /dev/null
            git checkout $2 $3
            ;;
        esac
        popd                                                                                                    2> /dev/null  > /dev/null
    fi
}




# better make sure; had trouble a few times...
#checkout_branch js/CKeditor.development                                       experimental                                $@
#checkout_branch js/d3                                                         master                                      $@
#checkout_branch js/elFinder                                                   2.1                                         $@
#checkout_branch js/elFinder                                                   2.x                                         $@
#checkout_branch js/elFinder                                                   nao-2.1                                     $@
#checkout_branch js/elFinder                                                   nao-2.x                                     $@
#checkout_branch js/highlight                                                  for-npm-install                             $@
#checkout_branch js/less                                                       release                                     $@
#checkout_branch js/slickgrid                                                  frozenRowsAndColumns-work                   $@


checkout_branch css/bootstrap-themes-bootswatch                               gh-pages                                    $@
checkout_branch css/Font-Awesome                                              experimental                                $@
checkout_branch css/Font-Awesome/_gh_pages                                    gh-pages                                    $@
checkout_branch js/backbone                                                   gh-pages                                    $@
checkout_branch js/backbone-associations                                      gh-pages                                    $@
checkout_branch js/backbone-fundamentals-book                                 gh-pages                                    $@
checkout_branch js/backbone-ui                                                validation                                  $@
checkout_branch js/backbone/.git                                              gh-pages                                    $@
checkout_branch js/Bootstrap-Form-Builder                                     gh-pages                                    $@
checkout_branch js/circle-menu                                                gh-pages                                    $@
checkout_branch js/CKeditor.development                                       major                                       $@
checkout_branch js/crossfilter                                                gh-pages                                    $@
checkout_branch js/d3                                                         all_scales_have_subticks                    $@
checkout_branch js/d3-nvd3-charts                                             gh-pages                                    $@
checkout_branch js/d3/examples/github.Addepar.ember-table                     gh-pages                                    $@
checkout_branch js/d3/examples/github.anilomanwar.d3jsExperiments             gh-pages                                    $@
checkout_branch js/d3/examples/github.artzub.wbgds                            smy                                         $@
checkout_branch js/d3/examples/github.BertrandDechoux.d3js-sandbox            gh-pages                                    $@
checkout_branch js/d3/examples/github.calvinmetcalf.leaflet.demos             gh-pages                                    $@
checkout_branch js/d3/examples/github.fod.jobflow                             gh-pages                                    $@
checkout_branch js/d3/examples/github.latentflip.violin                       gh-pages                                    $@
checkout_branch js/d3/examples/github.ramnathv.slidifyExamples                gh-pages                                    $@
checkout_branch js/d3/examples/github.saranyan.commerce_wheel                 gh-pages                                    $@
checkout_branch js/d3/examples/github.scottcheng.bj-air-vis                   gh-pages                                    $@
checkout_branch js/d3/examples/github.vogievetsky.IntroD3                     gh-pages                                    $@
checkout_branch js/dropin-require                                             gh-pages                                    $@
checkout_branch js/elFinder                                                   extra-fixes                                 $@
checkout_branch js/highlight                                                  master                                      $@
checkout_branch js/mercury-wysiwyg-editor                                     mercury2                                    $@
checkout_branch js/iscroll                                                    v5                                          $@
checkout_branch js/jasmine/pages                                              gh-pages                                    $@
checkout_branch js/jasmine                                                    master                                      $@
checkout_branch js/jquery-dirtyforms/lib/facebox                              cssified                                    $@
checkout_branch js/jquery-facebox                                             cssified                                    $@
checkout_branch js/jQuery-File-Upload                                         gh-pages                                    $@
checkout_branch js/jquery-form-accordion                                      gh-pages                                    $@
checkout_branch js/jquery-print-in-page                                       gh-pages                                    $@
checkout_branch js/jquery-sparkline                                           takacsv-work                                $@
checkout_branch js/jquery-ui-keyboard                                         gh-pages                                    $@
checkout_branch js/jquery-waypoints                                           gh-pages                                    $@
checkout_branch js/json3/vendor/spec                                          gh-pages                                    $@
checkout_branch js/large-local-storage                                        gh-pages                                    $@
checkout_branch js/less                                                       master                                      $@
checkout_branch js/Modernizr                                                  improvedAsyncTestSupport                    $@
checkout_branch js/moment                                                     develop                                     $@
checkout_branch js/mousetrap                                                  wrapping-specific-elements                  $@
checkout_branch js/noty                                                       gh-pages                                    $@
checkout_branch js/one-color/slides/3rdparty/CSSS                             gh-pages                                    $@
checkout_branch js/pie-menu                                                   gh-pages                                    $@
checkout_branch js/radial-responsive-menu                                     gh-pages                                    $@
checkout_branch js/reveal.js                                                  hakim-dev                                   $@
checkout_branch js/slickgrid                                                  k0stya-rowspan                              $@
checkout_branch js/spectrum                                                   no-color                                    $@
checkout_branch js/spectrum/lib/TinyColor                                     gh-pages                                    $@
checkout_branch js/spin                                                       gh-pages                                    $@
checkout_branch js/square-responsive-menu                                     gh-pages                                    $@
checkout_branch js/SyntaxHighlighter                                          highlight-and-annotate-per-line             $@
checkout_branch js/TinyColor                                                  gh-pages                                    $@
checkout_branch js/zoom                                                       for-revealJS                                $@
checkout_branch doc/php-opauth-docs                                           gh-pages                                    $@
checkout_branch php/PHPExcel                                                  develop                                     $@
checkout_branch php/phpmailer                                                 smtp-refactor                               $@
checkout_branch tooling/docco                                                 jump_menu                                   $@
checkout_branch tooling/docco/lib/highlight.js                                for-npm-install                             $@
checkout_branch tooling/javascriptlint                                        working-rev                                 $@
checkout_branch tooling/jison                                                 master                                      $@
checkout_branch tooling/jison/gh-pages                                        gh-pages                                    $@
checkout_branch tooling/jsbeautifier                                          gh-pages                                    $@
checkout_branch tooling/phpDocumentor                                         develop                                     $@


popd                                                                                                    2> /dev/null  > /dev/null


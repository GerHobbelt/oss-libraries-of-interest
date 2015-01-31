#! /bin/bash
#
# Checkout each git repository to the given branch/commit or list them
#

mode=h;
getopts ":hlc" opt ; do
#echo opt+arg = "$opt$OPTARG"
case "$opt$OPTARG" in
l )
  echo <<EOH
Git repository directory         :: commit hash / branch name
---------------------------------::--------------------------
EOH
  mode=h;
  ;;

c )
  mode=c;
  ;;

r )
  mode=r;
  ;;

* )
  cat <<EOH
checkout_to_known_git_branches_recursive.sh options

Options:

-h      : print this help
-l      : LIST the branch/commit for each git repository (directory) registered in this script.
-c      : CHECKOUT each git repository to the BRANCH registered in this script.
-r      : CHECKOUT/REVERT each git repository to the COMMIT registered in this script.

Note:

Use the '-r' option to set each repository to an exact commit position, which is useful if,
for instance, you wish to reproduce a previous software state such as rewinding to a previous
software release, which you wish to analyze/debug.

EOH
  exit 1;
  ;;
esac

EOH


# args: DIR COMMIT [BRANCH]
git_repo_checkout_branch() {
  if test "$mode" = "c" || test "$mode" = "r" ; then
    if test -d "$1" ; then
      pushd "$1"                                                              2> /dev/null  > /dev/null
      cd "$1"
      if test "$mode" = "c" && test -n "$3" ; then
        # make sure the branch is created locally and is a tracking branch:
        git branch --track "$3" "remotes/origin/$3"                          2> /dev/null  > /dev/null
        git checkout "$3"
      else
        git checkout "$2"
      fi
      popd                                                                     2> /dev/null  > /dev/null
    fi
  else
    if test -d "$1" ; then
      echo "$1    :: $2 / $3"
    else
      echo "[DIRECTORY DOES EXIST!] $1    :: $2 / $3"
    fi
  fi
}


#
# Make sure we switch to the utility directory as all the relative paths for the repositories
# are based off that path!
#
pushd ../util                                                            2> /dev/null  > /dev/null



#
# The registered repositories:
#

git_repo_checkout_branch "../buttons/famfamfam" b4e35f6abfa4bd8dde2505ee0f2146c596b4b4f8 master
git_repo_checkout_branch "../buttons/tango-iconset-naming" 6ad0716cc159e93f3c8f7484da6793a3218ffaf5 master
git_repo_checkout_branch "../buttons/tango-iconset-theme" 00a48744dc9e6b4cf0c2e79eb8f47b2a762a79c9 master
git_repo_checkout_branch "../css/Blueprint-HorizontalDropDownMenu" d01ed4a928f6483be674278617eacb596cf3eada master
git_repo_checkout_branch "../css/Blueprint-SlidePushMenus" a05356c3225e81924bd2068f72b043735302c470 master
git_repo_checkout_branch "../css/blueprint.css" 4fd30eb3436b0e0e8efcb396832ef58b76defd4a master
git_repo_checkout_branch "../css/blueprint.less" e4d1aa3f478f0612b41f8c654b7be2e7f5d3564e master
git_repo_checkout_branch "../css/bootstrap" 5775e011f69d3a32f08874094f0dea18a6645e14 master
git_repo_checkout_branch "../css/CSS-arrow-please" e9d0b487c4fac8fc45a0efa8b1c99573e08f34ff master
git_repo_checkout_branch "../css/CSS-hint" 5ff09413f2a097e0a18c569cf008683d1af43454 master
git_repo_checkout_branch "../css/Fluid-Baseline-Grid" be5fa84192a621731485acea5f992fee5a101f08 master
git_repo_checkout_branch "../css/focal-point" 32757bd4ad0a000283b8481aaba7818edb0e9dd7 master
git_repo_checkout_branch "../css/formalize" fa641e6f2dd831406f2a804bf67d043420a93cba master
git_repo_checkout_branch "../css/Gesso" be0c1ffd6c0e9fff9c8b03250a34e8f3b41e7034 master
git_repo_checkout_branch "../css/jquery-mobile-flat-ui-theme" f33a232328c51941d55c8abebe3471185280c33f master
git_repo_checkout_branch "../css/keys" 76bb603e921d0145362e0f60eabb79d4f69cbda0 master
git_repo_checkout_branch "../css/LESS-Prefixer" f441f348096a89811ebd7a29b5089ca3bde036c1 master
git_repo_checkout_branch "../css/less-triangle" a0a9486685947f35a2d73a75204913dc5caa4ce5 master
git_repo_checkout_branch "../css/lesshat-mixins" 810ffd0f3e66ae516ded56bf407b9a50c28be1bb master
git_repo_checkout_branch "../css/normalize" dafaf9ee60ff76173954aca755c78a6912a0ee6c master
git_repo_checkout_branch "../css/normalize-opentype" c979dea4b7816a0b5b1fd1f6af0fca9a6b525efa master
git_repo_checkout_branch "../css/priss" 9e45a44723b87ea6d0d1a652fc560ce1b6e19c50 master
git_repo_checkout_branch "../css/sassline" efc9466dabb39573aae1324c24123acba1d6b9dc master
git_repo_checkout_branch "../css/SlickMap-CSS" a2c4ec76657ebe59ccf26a507b7e1cfc21a06aca master
git_repo_checkout_branch "../css/topcoat" e6beda6aa855ba7bd1ef7a6a193d8206fa6f9b4d master
git_repo_checkout_branch "../css/uni-form" 3bb94bf919dfa0d99cab3f5619d7bcde7fcee6cc master
git_repo_checkout_branch "../doc/crossfilter-wiki" 0772796aa572017e80089d6d006af28a0dbec907 master
git_repo_checkout_branch "../doc/d3-nvd3-charts-wiki" 9123944f10ff6c9d97439eaeba5f51cd78f042d6 master
git_repo_checkout_branch "../doc/ECMAscript.5" 11d1470e32fdeee84091e943a3f585ebbef586a5 master
git_repo_checkout_branch "../doc/gitmagic" 775e73a5c846557fef5ee94101e24ed668474d53 master
git_repo_checkout_branch "../doc/json-schema" cc8ec81ce0abe2385ebd6c2a6f2d6deb646f874a master
git_repo_checkout_branch "../doc/Know.Your.HTTP" c60d9016ca5b30001a1ef93894182cc99aafab50 master
git_repo_checkout_branch "../doc/mathjax-docs" cfc87bbe283faf2b10688dcf1b8aad56649cd411 master
git_repo_checkout_branch "../doc/php-opauth-docs" 1f99c720e90c5f1c0638cd002dc0031590152455 gh-pages
git_repo_checkout_branch "../doc/slickgrid-wiki" 2efc9f13f8416afcc23d97f0468db533eb8853d5 master
git_repo_checkout_branch "../examples/AMDjs-API" 8180d01f94931fa4a5d598487ca4c2e28e610a07 master
git_repo_checkout_branch "../examples/antlr-examples" 48f9ef439d06f5e6d9c7046a988b00e965319e66 master
git_repo_checkout_branch "../examples/AppCache.Demo" bd7666cb5b033839151da6b39486def6d4100127 master
git_repo_checkout_branch "../examples/Backbone-example-directory" 0ef04ec2dc8ce8d74b668749c548edc3c6c512a6 master
git_repo_checkout_branch "../examples/backbone-iOS-html5demos" 30260a37a8a16132fcfe515415a87b0404179488 master
git_repo_checkout_branch "../examples/Backbone-Require-Biolerplate-example" c99e74149d68da792c0c6aa4028ac6723c29fa55 master
git_repo_checkout_branch "../examples/BookPreview" 741cbc217912f6f3d1c1ef3d76062c0c63d52c05 master
git_repo_checkout_branch "../examples/Bootstrap-Form-Builder" f09416f2a8c096c627c3925bb57cb9a43aeea930
git_repo_checkout_branch "../examples/bootstrap-themes-bootswatch" 4f965965b6e8a39502e571fea51523ca31d798d7 master
git_repo_checkout_branch "../examples/concord-consortium-HTML5-laboratory" b3dace42b27b4133cc5e8cc020c55f90523d6999 master
git_repo_checkout_branch "../examples/d4-examples-website" 953e4c3bf95ee4fc0152ce9b86369e4ac256e3d0 master
git_repo_checkout_branch "../examples/DeckJS-CodeMirror-Example" ab6761e08d107b142a75a98422e51e84a2df8054 master
git_repo_checkout_branch "../examples/fullscreen-form" 0fea38a0024f25bedcba185423ef96bf1dd5dc7f master
git_repo_checkout_branch "../examples/HTML5-Clear-v2-demoapp" 97de81a6d97ac6a4356450d80b9b9d4bf2648476 master
git_repo_checkout_branch "../examples/HTML5-Offline-Form" b2b4e52c25c0d227ec68949e44ff3bc6ba84f6cd master
git_repo_checkout_branch "../examples/html5demos" fa6ad18b6bba9bd1b5fbf80870b13cc1ec827e5b master
git_repo_checkout_branch "../examples/interdependent-interactive-histograms" 24fc535a722100d99fe1092981416e8cd18f2c0c master
git_repo_checkout_branch "../examples/jquery-boilerplate-patterns" 0cdb36cf96408f6a42117c1500f716cd4362867d master
git_repo_checkout_branch "../examples/json-select.tests" 29f2882e30268ea1b0a6f1bf6a5b6e07e7136444 master
git_repo_checkout_branch "../examples/mathjax-acidtests" b18c8872ca9b9f738ebaf5429313bc1bf3917ceb master
git_repo_checkout_branch "../examples/mathjax-test" 6859307d174e29aca7dc9028249d18b9dc704bde master
git_repo_checkout_branch "../examples/modal-window-CSS3-effects" 859d73f6f88e763ad10e698746cb94acceb870d9 master
git_repo_checkout_branch "../examples/PEG-js-web" 799dd94d7411483b2943f85a61e3fe7471208095 master
git_repo_checkout_branch "../examples/postal-xframe-example" 59ee0130dcb7bcb9857db3a2c3ed3673ae688b5f master
git_repo_checkout_branch "../examples/Responsive-Off-Canvas-Menu" 73dbd4190897e1794d03bea9b77450f08a829624 master
git_repo_checkout_branch "../examples/tether-shepherd-intro" 624481fec8f0bc4d0d8b56cd50991197d8eac510 master
git_repo_checkout_branch "../examples/UMD-Universal-Module-Definition" caa1a477ddf01603f4d9b928934c9e367f78431a master
git_repo_checkout_branch "../fonts/EB-Garamond" 726709a14dc1e6445c9d879ad5217985632ad13b master
git_repo_checkout_branch "../fonts/Font-Awesome" 8b5086e1479f8a4a2725a98001985da6319e5071 master
git_repo_checkout_branch "../fonts/Font-Batch" 23c24042baea66c27ca90050e1c0d3b4058e5809 master
git_repo_checkout_branch "../fonts/Font-Genericons" 0baeeca02933cc5f269d09a93130bf9e24d120cf master
git_repo_checkout_branch "../js/accounting-format" 1fc18efe4ca53a21ff7d99051572de6fd18efc5a master
git_repo_checkout_branch "../js/ajaxify" 48ade184f27cf26d8eade526db0228aad059b89e master
git_repo_checkout_branch "../js/AMD-feature" 22e8c4616a0a732117894b08fb5fd4e173147c7e master
git_repo_checkout_branch "../js/animation-frame" 8c75d99fbddc63e554e107b93dbca55f466ea2df master
git_repo_checkout_branch "../js/AnythingZoomer" f45cb3647ce418cde1197542fcafcf9c4c79e39d master
git_repo_checkout_branch "../js/at.autohinting" fc18ea71a7bcec4ab423dee1016e22582a4fcd54 master
git_repo_checkout_branch "../js/autoNumeric" 62c625cf10e7ad7d004e81e5cdd359c164303124 master
git_repo_checkout_branch "../js/autosize" cb50e5428843bac5bb45203c4c5f058880c5011a master
git_repo_checkout_branch "../js/backbone" 7bbb509d7342ae112f764ea5c4270e798d20ba5a master
git_repo_checkout_branch "../js/backbone-act-as-configurable" 3f0ac1e5ae2e33f88c6adcb24a109198f7e12a23 master
git_repo_checkout_branch "../js/backbone-act-as-mementoable" e66b2d905e34b8bcc9f257eb4761dd5cf5043df0 master
git_repo_checkout_branch "../js/backbone-act-as-paginatable" 320e3c88b0889059bcc1e43578ede65574498603 master
git_repo_checkout_branch "../js/backbone-activities" 7f8c3e3fc8f09bc2f6b66f26e8e9b3197824cc0b master
git_repo_checkout_branch "../js/backbone-associations" c20da878d339c822eb3300d22a0ab75e8d238b20 master
git_repo_checkout_branch "../js/backbone-autocomplete" 6ab120943b97a24e9063dd66947ccb7d96554918 master
git_repo_checkout_branch "../js/backbone-boilerplate" daa467e5f00fda6360e7f7fe160c5d28ea99bf47 master
git_repo_checkout_branch "../js/backbone-bootstrap-modal" e7ff6e45d0bf297b6cc1d36a8d5891b849a63383 master
git_repo_checkout_branch "../js/backbone-chosen" d52786bfeaeb507e002eb25a396a60afc5b0cc49 master
git_repo_checkout_branch "../js/backbone-collection-view" 1d4357328db3e7811d815f689e49f2d754480818 master
git_repo_checkout_branch "../js/backbone-collectionsubset" 48c3a7956c9c0c25c1214436df06ebd8938f7c58 master
git_repo_checkout_branch "../js/backbone-courier" 12520cad717265793ac1bf1509f50f4700eb0732 master
git_repo_checkout_branch "../js/backbone-D3" d8dd94abd95a4fde3e3651cebe349af58484f96f master
git_repo_checkout_branch "../js/backbone-deep-model" f50cf95273075f1b16cd6edcc1a3e37c68392e27 master
git_repo_checkout_branch "../js/backbone-dual-storage" 2579e33034c1cb4f27c286f9ef136af590cf6ec1 master
git_repo_checkout_branch "../js/backbone-eventbroker" 73bc91eca2b958b3ddaf36f7810b049d3b3296c0 master
git_repo_checkout_branch "../js/backbone-factory" ca14482bf13b4670128bc0291dd108fcc4cbeec0 master
git_repo_checkout_branch "../js/backbone-fetch-cache" a5f5f64d41e9c339748198693fd2d53b07c0fc08 master
git_repo_checkout_branch "../js/backbone-forms" b589879023025313ef5a8929f67d4d7199cfa2f2 master
git_repo_checkout_branch "../js/backbone-fundamentals-book" eca98953faf0af9771df3051d7066c8d85b1f881 master
git_repo_checkout_branch "../js/backbone-getters-setters" 149046fa7485a2acc2c8eff5b7ffb1cf7ca60e0e master
git_repo_checkout_branch "../js/backbone-giraffe" 8e85bf0752052d315d7a7bdf54f55bc531d5049a master
git_repo_checkout_branch "../js/backbone-iobind" 9382fcf0e29dd02d6755ac07005f1427db4c600f master
git_repo_checkout_branch "../js/backbone-jasmine-koans" 2d78eacd695714eb613640b15c89a1ff6396775c master
git_repo_checkout_branch "../js/backbone-jwerty" d0663f72b9bbc35abb93b61a3461032d444ff05c master
git_repo_checkout_branch "../js/backbone-keys" 2232e6e4df5f2aa6cb7021758b0e13551fad1ea6 master
git_repo_checkout_branch "../js/backbone-localstorage" 1f62d7cdca662c7b65da6b4337c3f166c08135c9 master
git_repo_checkout_branch "../js/backbone-managedview" 9d68e48f586878aedce7eb1847540d6cb0e617fc master
git_repo_checkout_branch "../js/backbone-marionette" 93ff33c7703a75f55b83b2ddf7da86d6037fd7c6 master
git_repo_checkout_branch "../js/backbone-memento" 28c4eea7b8f926c41c197207639b78aeba3ac16e master
git_repo_checkout_branch "../js/backbone-modal-view" 43e0dd73983ec6f35ab9dbc0fd8ce0abb41d0910 master
git_repo_checkout_branch "../js/backbone-model-binder" 2e2c28651b96c8150119486bc4872a4a211257f6 master
git_repo_checkout_branch "../js/backbone-model-factory" 4dad927cf4608fda14fe9e046632007e24c0d06a master
git_repo_checkout_branch "../js/backbone-modelref" 6aa5928ce351e7fa1505886b9e5c8db048e48484 master
git_repo_checkout_branch "../js/backbone-mousetrap" 3172bd4beaf04219d8aa37dbb4097dfb6abdb154 master
git_repo_checkout_branch "../js/backbone-mutators" 01d93c4e7f84db8c1d12af8c70199d66aff50cf3 master
git_repo_checkout_branch "../js/backbone-namespaced-events" 840d1b18e1cea06c6519976ab9a5d888dc88f0c3 master
git_repo_checkout_branch "../js/backbone-nested" 9ddd1faf9093b63571098eca4d3041d83c5e5837 master
git_repo_checkout_branch "../js/backbone-notifier" 1e1d06715a7d05eccfe780757611b7a559c56923 master
git_repo_checkout_branch "../js/backbone-offline" e81067d74baefe9359ea17f1c1f017ade152b8e3 master
git_repo_checkout_branch "../js/backbone-pageable" b03d30d473b21c413277d74f0193f77517610fda master
git_repo_checkout_branch "../js/backbone-paginator" 84146e82777419ffe91a48e5d1dcb96f062a4f36 master
git_repo_checkout_branch "../js/backbone-poller" 613a9e9841fa2f119e232223d14d70fd88ac5a7a master
git_repo_checkout_branch "../js/backbone-query-parameters" 05549743edc5f8ef233d9ef5fe0d00941e41e115 master
git_repo_checkout_branch "../js/backbone-rel" 06bbb16fa11a66d8915a74ce1aef560e3992ca2f master
git_repo_checkout_branch "../js/backbone-relational" d4369341a61e48137f846fbd391d101568bde4b6 master
git_repo_checkout_branch "../js/backbone-relational-tutorial" 415c54d5c5fb4c5669df78614b321c4fd0028b33 master
git_repo_checkout_branch "../js/backbone-safe" 6bff63743e76b386cfa1264f35a4d45e2ebd855b master
git_repo_checkout_branch "../js/backbone-safesync" 95ed413a75a99d03a8b0f6a22c7ee706b265c53d master
git_repo_checkout_branch "../js/backbone-shortcuts" 09fbd0e9632ca422445be213209aaf9d520215db master
git_repo_checkout_branch "../js/backbone-singleton" 8b381bd5d2fcbcd1b39d9de25dd667270132d9b4 master
git_repo_checkout_branch "../js/backbone-stickit" 7c0b963eb02c776f1a5d4ebaeff331f185b42763 master
git_repo_checkout_branch "../js/backbone-subroute" fad036a2b065585bff0a75bbdea28cbacb9f75d0 master
git_repo_checkout_branch "../js/backbone-subviews" a04ec6789eb0a77637ce6bc6b228f66ccfaa7908 master
git_repo_checkout_branch "../js/backbone-super" 01f73ce64fbc7529be9d1255c7edf77f6d46742b master
git_repo_checkout_branch "../js/backbone-syphon-serialize-views" 587b3f086e8eac3955ac71c0934cd1e40106a12a master
git_repo_checkout_branch "../js/backbone-touch" bb5e4709aa7a9ff2f0bd60080e0626f308893a05 master
git_repo_checkout_branch "../js/backbone-ui" b0a9a49c663eb148bad09814ec0fa7fe9af2f1a6 master
git_repo_checkout_branch "../js/backbone-validation" 769c357c3cca9479980f0a7e6965826e9997b39f master
git_repo_checkout_branch "../js/backbone-validations" 94da5c317709c6bf7e68574cd1b4b389591dfcde master
git_repo_checkout_branch "../js/backbone-validator" 7f04914e82b6777d4100d89493b3015f26e89a35 master
git_repo_checkout_branch "../js/backbone-view-model" 914c6785d85fbcedc5a098ef8396e8415ac6473a master
git_repo_checkout_branch "../js/backbone-virtual-collection" 3f9889691ae808ef428563c97b25d62f4eafa83d master
git_repo_checkout_branch "../js/backbone-workflow" cc75604fbad8b448127dd5ff089c6117a558cc4b master
git_repo_checkout_branch "../js/backbone.layoutmanager" b2b1055d15de370f0cfe5860216b2f3f3cc2921e master
git_repo_checkout_branch "../js/bacon-frp" 4a931d31755c88ebd9b46b42a6148e5ddb95314b master
git_repo_checkout_branch "../js/baseline-image" 75a85cb68a29b2c4725e76698caafc8128a0ad48 master
git_repo_checkout_branch "../js/BeatMaster" be8b5fb8ddb5482cc201abaea4258f22791654f6 master
git_repo_checkout_branch "../js/BeatMaster/lib/js/animation-frame" 8c75d99fbddc63e554e107b93dbca55f466ea2df master
git_repo_checkout_branch "../js/benchmark" 425373377516c4af25eec12e4e3211b3550d9ea6 master
git_repo_checkout_branch "../js/better-assert" 76929a8f00c6781968cce0aca2beafecbb995800 master
git_repo_checkout_branch "../js/BigUpload" 105ede4d2c029f1f32f3536f5f8788804644086c master
git_repo_checkout_branch "../js/Blob-filesystem-shim" 8c1deeb4bd4f80c57aaa4f13dd86c634ff621b74 master
git_repo_checkout_branch "../js/BookBlock" ec1cb343be71431f47e1c74b564eb986f8425866 master
git_repo_checkout_branch "../js/BookJS" 5297025fc74209cdbea6a06137001e065ad01adb master
git_repo_checkout_branch "../js/bxslider-4" 1e6b1e7ae8bfa0b104daf95bef6ca0256a558ad5 master
git_repo_checkout_branch "../js/c3" 5c918985e5fee9d2a9099ab0d3395e77a31e8f5c master
git_repo_checkout_branch "../js/callsite" 6a3726f25d5979e55c740a92823f377e9f8cff5f master
git_repo_checkout_branch "../js/canvas-to-Blob.js" 27bbe1d4f063d6f735b48a33c12f247ced93d008 master
git_repo_checkout_branch "../js/caret-position" 72edcabcb3b7f41e59a112a7981b10389f1c2f1c master
git_repo_checkout_branch "../js/caret-position-in-textbox" 4784c56fdb2abd33fffcfef33103fc4867ff486f master
git_repo_checkout_branch "../js/cash-fast-jquery-alt" 70839298bc4d4e047b2a89ecd18ef27db4522b24 master
git_repo_checkout_branch "../js/catiline-webworkers" 9d219ab948e049dce03d7175b236d3ea88045746 master
git_repo_checkout_branch "../js/chai" 1df11d00275f526b596b933faab1479f7af7f7c5 master
git_repo_checkout_branch "../js/chroma" cc1c8397c1662809c4fd8d59926d3579ce8da756 master
git_repo_checkout_branch "../js/Chroma-Hash-password-entry-assist" 512a92ec395e1acc4147a2134145633263cdfa77 master
git_repo_checkout_branch "../js/chrono" f4077bb351104b1d2e97d5da7dbf8ce00cd58ae7 master
git_repo_checkout_branch "../js/circle-menu" da6a48de30fda0a6c9e9e8509d56da34bb4e4260 master
git_repo_checkout_branch "../js/CKeditor.development" 258e2ba1d3ec3a16d03c9c483194943f4496bcdd master
git_repo_checkout_branch "../js/CKeditor.releases" 464bd3176e1f4e95f03211d6b192ebefe1ac8570 master
git_repo_checkout_branch "../js/classlist-shim" 9cc24fe044356d1d5141e50cb0f59ecdb8ac8044 master
git_repo_checkout_branch "../js/clipboard" c77943325384093b718fd1c0d44d754a21ab7209 master
git_repo_checkout_branch "../js/code-walker" 34714e8018a0da733f18ccdf849bababe217dcd2 master
git_repo_checkout_branch "../js/CodeMirror" 93a889dd6b6ee62a9eb1e0de71d6f3a3356c97a8 master
git_repo_checkout_branch "../js/CodeMirror-UI" 4ec880ca7bcff9f0eb4da39bdf4ce729d3cfa3fd master
git_repo_checkout_branch "../js/color-diff-CIEDE2000" 5c589cd221d9a743dbd9ffaf8b07d53451fc36dd master
git_repo_checkout_branch "../js/colorjoe" 5f76862a6c8105cb7740b535ad02fe2b0f0b8e0c master
git_repo_checkout_branch "../js/colorPicker-WCAG2" 3700b24b2f39836e8dae1541024a9ec8d41485a8 master
git_repo_checkout_branch "../js/consolidate-template-engines" 84c691ad69b7a9316e4af2816f6eb2cbc5f8312b master
git_repo_checkout_branch "../js/crc8" d68924223db36a5937c4accd2bfa7c869cf0acb9 master
git_repo_checkout_branch "../js/create" 00d43ea4e53ea084333f0280753964db9131ade5 master
git_repo_checkout_branch "../js/crossfilter" d84c7d770ba6c8567630281995ff7aa6350e8317 master
git_repo_checkout_branch "../js/crossroads-router" 05a5bfa6dbba51359173ec9c22a4bea2396fd6d5 master
git_repo_checkout_branch "../js/crypto-js" 34b30e52b82a151f2229b3d2974a55d66c0bd5cf master
git_repo_checkout_branch "../js/crypto-js-hashes" 007d2dc8efdd6dd480ed80355c5ca6b89dc896ba master
git_repo_checkout_branch "../js/crypton-zero-knowledge" ba725485a91928c7e62d1b405d83c9de85796b8e master
git_repo_checkout_branch "../js/cssrule.js" 3e28ca5f1fe51c09ec6a6812204c56d0e88da654 master
git_repo_checkout_branch "../js/d3" b9e022444e7fdc4f6fe6e64e97822a260622ef2c master
git_repo_checkout_branch "../js/d3-DexCharts" 953806e08f3c5c2120703a91b924183ecd8c462a master
git_repo_checkout_branch "../js/d3-dimple" dd7009ef20785c3c0e840e968bdda0dc672f0ac2 master
git_repo_checkout_branch "../js/d3-nvd3-charts" e99aa3088e2e87ec563f2da990c6914f8cb37554 master
git_repo_checkout_branch "../js/d3-plugins" 95fb7ac1823fe49ce334de3eb2c542ea8165fe00 master
git_repo_checkout_branch "../js/d3-tooltip" 15fef5c3e84ce0291dfcac812a655d66886c032e master
git_repo_checkout_branch "../js/d3-xcharts" e11d90c9b3efaea3c147f4bb3321793b6a834ae6 master
git_repo_checkout_branch "../js/d4" 2da1bcff4c28e8ccd41142e12c912c3d16841573 master
git_repo_checkout_branch "../js/dagre" 7602bafe05340252e2c319b3f6bcc86852cad317 master
git_repo_checkout_branch "../js/dat.gui" bcdaa755a6bcc8329b1ab71b7b818606af81b37f master
git_repo_checkout_branch "../js/datavore" d73c083f793290aaba1d33ec8158cdbf4ad1c560 master
git_repo_checkout_branch "../js/dc" 80e6c41cb7f6267af72382aba4298e479eb34184 master
git_repo_checkout_branch "../js/debug-helper-functions" b68534af669e50b77b7a2dff79c2233c6d69b959 master
git_repo_checkout_branch "../js/deck.js" e9d7055c855064c8d7688c3d902b84afcd13624e master
git_repo_checkout_branch "../js/detect-zoom" 6f6efc6a289035132236344eadb46fa15171d973 master
git_repo_checkout_branch "../js/director-router" dacf5479859dda414ebf96a26a60e317df04a646 master
git_repo_checkout_branch "../js/docson-json-schema" 21fff356cb41a70ca5235d8c7f252de4faeb8ac8 master
git_repo_checkout_branch "../js/DOM-keyboard-event-polyfill" 3088b90fbee9421db442b859b33fe372f3f9cc4d master
git_repo_checkout_branch "../js/domready" c31fbd0a6f9aa859a4f2493c538a677e8476dc56 master
git_repo_checkout_branch "../js/DOMtastic-fast-jquery-alt" fc0a19508227641bfacc50b081fc060593baa946 master
git_repo_checkout_branch "../js/Downloadify-local-file-save" 4de12cb943f30f22849d79a52b86a9fd9a9c5c2f master
git_repo_checkout_branch "../js/dropin-require" 7da53c86c6d50c1551e8faa8db274db4e77fc25c master
git_repo_checkout_branch "../js/dropzone" cb1265ca879d50a61d4f020fc2b8ec22a365135e master
git_repo_checkout_branch "../js/echo3" 38c1fdb96cbfc0c52bc12eaa1e21fa6f34a49b74 master
git_repo_checkout_branch "../js/edison-routing" 15d20758bc751190e640ce974d973f47c5739597 master
git_repo_checkout_branch "../js/editable-contenteditable" fb0552a21513ec357e9a88a5a06ed09f1fbcdc83 master
git_repo_checkout_branch "../js/elFinder" c91226ef2f803cd60295314a40dc27c9437907a0
git_repo_checkout_branch "../js/event.js" be033483a41feaceb1b5ebf9c1bdd7f45c6ce907 master
git_repo_checkout_branch "../js/famous" 4d9c58a5ff8067207c9bd0d7be693a9fa7854284 master
git_repo_checkout_branch "../js/fastclick" 040fa81e973da33219d8e8326716d71743a900d7 master
git_repo_checkout_branch "../js/fd-slider" c7d6da543fe2cde3a37d00e20d1eb058d8779197 master
git_repo_checkout_branch "../js/File-manager" b7aeca655a75eb7cfc598c1d6b55fd1351babbf6 master
git_repo_checkout_branch "../js/FileSaver-filesystem-shim" d20bfc4d3bf482963ed626eef20bdfa72339e03c master
git_repo_checkout_branch "../js/financial-Excel-functions" ee49a31c5fd6f86dfdb6c331e7992ebbfc836fef master
git_repo_checkout_branch "../js/finch-router" 512ee6eebc0b70b1a62b24b4d5754134969e4583 master
git_repo_checkout_branch "../js/finderSelect" b1aa497cea53cc9811848dacc07ca50d17c55127 master
git_repo_checkout_branch "../js/fingerprint" eb2b9ad851ef3e634170ed5233840ccad5da0e62 master
git_repo_checkout_branch "../js/flowtime" 8911c0f4d129974f566bc61ad1f89562fce2afe6 master
git_repo_checkout_branch "../js/Fluidbox" 4ee0d01d4108229de6f70b6ae60cadac4cba1a17 master
git_repo_checkout_branch "../js/fontIconPicker" ee4f686196aeef2c4ddf3c9e3be7f5f0e45a2013 master
git_repo_checkout_branch "../js/formatter.js" 36660b4bc26ca916ab5f9b5567c59ca6a1eee615 master
git_repo_checkout_branch "../js/formula-Excel-functions" 7d5a3be867b6ed1841a6fd42a69e3365aeab2c2d master
git_repo_checkout_branch "../js/ftcolumnflow" c18d408b04dfd0b1e6a20fd38f08fa65ed2985ba master
git_repo_checkout_branch "../js/ftdatasquasher-pack-into-utf8-bytes" e76b3b2a8b90dae601a7193b2f4453ed35abc027 master
git_repo_checkout_branch "../js/ftdomdelegate" 8b086e6bc913aa548178f9bd40448576083f5711 master
git_repo_checkout_branch "../js/ftellipsis" f7f867e90f4285718d235a061e9c65d81b658c95 master
git_repo_checkout_branch "../js/ftscroller" 86f43649e075c0539f0bc8f877531fb2fffe865e master
git_repo_checkout_branch "../js/fullscreen-API-polyfill" 22c9ea2f1bd7e8894dcb85511869f959a5e0f41b master
git_repo_checkout_branch "../js/functional-js" 3991d2becd7661640ff6a3b2a7403e1314413636 master
git_repo_checkout_branch "../js/Garlic" 1d9fe8a4626fb7db25b9e8bd36f8ae581c22c4bc master
git_repo_checkout_branch "../js/genie" 4d4d554ad0a075a9a4d88b8161ad8d7e41b2a1e8 master
git_repo_checkout_branch "../js/google-channelplate" 60aaf7212852fa915cc235fcfc466b478ba5b000 master
git_repo_checkout_branch "../js/gridster" b73f371bf322d86e86d391a6bb1f41f070b1fd2a master
git_repo_checkout_branch "../js/hallo" e274abfe7cdc59c603b29199c7b58c7906f690d6 master
git_repo_checkout_branch "../js/hammer" ef1ec7a248aee3c3544d5d9aad9685c25fe3fc11 master
git_repo_checkout_branch "../js/handlebars" efad61b1b72a487c087f57ba85287f5682e57280 master
git_repo_checkout_branch "../js/has.js" c6d621477d9113adba9af1d8b98f162c399771a6 master
git_repo_checkout_branch "../js/Hasher" 97b891aaceddd5bde62962d3945582efa40b97ab master
git_repo_checkout_branch "../js/headjs" 50981626624d610216d90ab69245775c523e9171 master
git_repo_checkout_branch "../js/highlight" 148c321f4b586be8cca17f300e45560ae5bb078f master
git_repo_checkout_branch "../js/hilitor" 6bd61f53be5b53e0bbc1627270932309f9d3d9d3 master
git_repo_checkout_branch "../js/history-js" a98aa3b3634c017b2280d63ef0d446618d6912e1 master
git_repo_checkout_branch "../js/html2canvas" a697b99822b88e2ea9772dbe449a118a4186ac08 master
git_repo_checkout_branch "../js/humane-js-notifications" 9b23fa913fdba798c0ba5f4518fe3f95f649fdf2 master
git_repo_checkout_branch "../js/impress.js" e6529cadd87af942aba4819f8ed7a6c1a4f0b3dc master
git_repo_checkout_branch "../js/IndexedDBShim" 4ade50aae17293274e96dd5c45660c76ffb7a2cb master
git_repo_checkout_branch "../js/IndexedDBWrapper" 85f3b14ab71d6c45a2fdfbeebf8963e342530334 master
git_repo_checkout_branch "../js/intercom" d6f49ad7db5df138ec9c4f4247526174464ff97f master
git_repo_checkout_branch "../js/intern" c8f845d8be64f0cc2ad6961a24b38351538cbc73 master
git_repo_checkout_branch "../js/intro.js" 457b4c321a130f25c92d8e3894f7ce405f757022 master
git_repo_checkout_branch "../js/iscroll" d31d6e6ff798a8adc572879549ac1a3e2f47a01e master
git_repo_checkout_branch "../js/jasmine" dc6d3e29fd5d0f474b33fafae4772d5fcd3d6066 master
git_repo_checkout_branch "../js/jasmine-ajax" 7a77ffb2bd15fbc7e3baa77e60e48bf6c2f6fb5a master
git_repo_checkout_branch "../js/jasmine-async" 97bd4e23ebc287f57bbdf055406b3588f20bfd3c master
git_repo_checkout_branch "../js/jasmine-backbone-matchers" 40140f7eea39688fc8f1eb0e214a6d83a4e0873a master
git_repo_checkout_branch "../js/jasmine-bootstrap" e06019ec5d288cee2f6bbfcf72a48333d2cd0b88 master
git_repo_checkout_branch "../js/jasmine-DOM" 4ab5ff8dc8f26c2400c2d9293422d3663ef16ed2 master
git_repo_checkout_branch "../js/jasmine-jquery" 99f20ab769fce11bca23305e779aa839425c9d3a master
git_repo_checkout_branch "../js/jasmine-matchers" 7ac87cc7309bf7ee2e49d58f6b01c55822c9fdaa master
git_repo_checkout_branch "../js/jasmine-matchers-1" d5b8d83e548dec582ca0385aebcf0c2c66a35711 master
git_repo_checkout_branch "../js/jasmine-signals" da60933727b2da1eb61f6dc4ed1cb45c68c8241e master
git_repo_checkout_branch "../js/jasmine-stealth" 8e79168f122e19ac3e25b9089f1362c479bad43f master
git_repo_checkout_branch "../js/jasmine-ui" 74657a362ee8e23778d48bac94ce2581871f3829 master
git_repo_checkout_branch "../js/jasmine-Underscore-matchers" fcf553e3922114b602432f7bfebe1112bdbe2644 master
git_repo_checkout_branch "../js/jasmine/documentation.website" 695c8cf5a468fe80e1f98050f54bc7769819e228 master
git_repo_checkout_branch "../js/jasmine/pages" 64493b062e41fdf24a82034ac4b76fc13826c6b2 gh-pages
git_repo_checkout_branch "../js/jasmine/pages/pages" e82a2ff018d71a78d3b470cf246bc1df700d4aba master
git_repo_checkout_branch "../js/javascript-debug" 6dcf21c756a3ec5cb31a663b80c035f14e3f4024 master
git_repo_checkout_branch "../js/JavaScript-MD5" c74b18ec61df8ff31a149c6326aaee7ece85ac89 master
git_repo_checkout_branch "../js/javascript-sandbox-console" 6e5cbe9acef032b64941c5c816c62a385eec5121 master
git_repo_checkout_branch "../js/javascript-stacktrace" 2c2c55d84a7ad01ebd6cf4afb9d06ed98885f39c master
git_repo_checkout_branch "../js/jquery" 48843eecd6d73a47584733784c28aa576bb7f533 master
git_repo_checkout_branch "../js/jquery-animate-enhanced" b5ed267f2160f1293dde2237682e703ac70362de master
git_repo_checkout_branch "../js/jquery-anystretch" 49c82f59f0533f37724f680473fb7a71fdd2b49f master
git_repo_checkout_branch "../js/jquery-appear" a855855b420f11b081123fb9089bbe994fc24aaf master
git_repo_checkout_branch "../js/jquery-autocomplete" 5db721d7b6612034f61b88ac11c74fe24df37f78 master
git_repo_checkout_branch "../js/jquery-autocomplete-orig" 59be0f63f66bfcdb29205cea1708e54f31e0e221 master
git_repo_checkout_branch "../js/jquery-autogrow" 34e1c8df232d7e8470d11727955752709d8aead1 master
git_repo_checkout_branch "../js/jquery-avgrund-modal" 8062ae2f0b454086c992d085ce7fc2de94e9592a master
git_repo_checkout_branch "../js/jquery-before-after" 80d6e6c33e26d5330fe6baba1e8a4bf96f967b87 master
git_repo_checkout_branch "../js/jquery-bgiframe" 18e67f19e3f9c7266a3baa4b988237be77c3ee56 master
git_repo_checkout_branch "../js/jquery-bigtext" 9a18f7ca5c062546b0b7c823e743693f992cbe76 master
git_repo_checkout_branch "../js/jquery-boilerplate" 899a1a6c5e13908821c2e5ae36ed8efdb218a1c0 master
git_repo_checkout_branch "../js/jquery-chaperone" f2a6233956ba12ee34cbac974530e9e64e656a98 master
git_repo_checkout_branch "../js/jquery-checkbox" 759a17c333f08a120a32f192b9adf2f1a3421379 master
git_repo_checkout_branch "../js/jquery-chosen" 1205c626a826a86619535099aad404bcd2ec61a1 master
git_repo_checkout_branch "../js/jquery-classList" 3011429602b2cc97da65bda79ecce8f5f06b10ea master
git_repo_checkout_branch "../js/jquery-cleverfocus" 7cdd8e9360a6c3f162d6c1bf5e3ef88afaa5e49e master
git_repo_checkout_branch "../js/jquery-color" 3e56c19b11ea18bf1b29f745278e738c89dfa2ce master
git_repo_checkout_branch "../js/jquery-colorbox" 7cea499d0f5602bba2973fee0ecdd383d05c6e7d master
git_repo_checkout_branch "../js/jquery-colorpicker" 188d0209285bbabd3f804ec8d4784f944c12d3b0 master
git_repo_checkout_branch "../js/jquery-colorpickersliders" 8470ee26aa7a5a9b6c735db340f662a26500d0c7 master
git_repo_checkout_branch "../js/jquery-columnizer" 0e8b30d84d2f1ae505072325a0d339b93d76609d master
git_repo_checkout_branch "../js/jquery-complexify" 1558b435eede8f145c68445fe5ed8ea3d08775aa master
git_repo_checkout_branch "../js/jquery-console" 9845faabd58828fcd53d36c15665d5b92bb0ad28 master
git_repo_checkout_branch "../js/jquery-contextmenu" 30f78054f7f2674c86104687d1174243f0aae5e8 master
git_repo_checkout_branch "../js/jquery-cookie" 9481ec9eb649e10cd8650d58c0170a36b2da10e7 master
git_repo_checkout_branch "../js/jquery-css-console" 37e078e5127321a6346970ae9565c8e19fdb88c3 master
git_repo_checkout_branch "../js/jquery-custom-input" c11f5d6cea833252eca00ca69ec3279e8cf9866c master
git_repo_checkout_branch "../js/jquery-cycle2" 5740915049fbf7a10fe040189dd835b6c8e1a692 master
git_repo_checkout_branch "../js/jquery-datepicker" eef9e0328eb3572665ce10613a197beff6ec8d2c master
git_repo_checkout_branch "../js/jquery-deserialize" 1260dc200f6959916152c9f9d3beb65048972ea9 master
git_repo_checkout_branch "../js/jquery-dform" ab8bc83c541b7c14c7e555c16c0f07b01fd30f5d master
git_repo_checkout_branch "../js/jquery-dialog" 2924a2f406e586730954f8b8ba1ca6cccae60d44 master
git_repo_checkout_branch "../js/jquery-dirtyforms" a7c6397e79375cfeaa91b66ff26dd4eeb32db50b master
git_repo_checkout_branch "../js/jquery-dropdown" 12d44c761a51e4c699f95d7d2748d0ecdaf067c4 master
git_repo_checkout_branch "../js/jquery-easie" 91f29ef0a2fc41d71980137f359ff25e4450a162 master
git_repo_checkout_branch "../js/jquery-editable" 249d252c2b4d3c4b2c0d6c7cc223f7e2ec8eadb4 master
git_repo_checkout_branch "../js/jquery-equal-heights" 3d9a5bc9339afa5b5800bfa3b952a2e9643b4f72 master
git_repo_checkout_branch "../js/jquery-equalize" de2cf61050e7e6b9b74f5ab4efafd6819ac26ea6 master
git_repo_checkout_branch "../js/jquery-event-drag-drop" 328826bdd9490a7130985620db6aa96fc899df0a master
git_repo_checkout_branch "../js/jquery-event-move" 80071a7b3ddbd2c3f0c0bfc97eb1dcdfbb5e88f8 master
git_repo_checkout_branch "../js/jquery-event-swipe" 6a284657be7f6ab45173a7cc7e626dc8e129faa8 master
git_repo_checkout_branch "../js/jquery-facebox" 054c2c90db7b4d119a5a445bfc65e8501f45d2b3 master
git_repo_checkout_branch "../js/jquery-fast-show-hide" 6631e08ebccb9b0f32bb7ecfca1a8c5feb2429a0 master
git_repo_checkout_branch "../js/jquery-fieldselection" 0a2447008b720e2ff46b8051915cdc4e864d6d0b master
git_repo_checkout_branch "../js/jquery-file-download" f8a3e5fb5729f8a55ff212f0beb86fb339be0035 master
git_repo_checkout_branch "../js/jquery-file-tree" f98aacd82ff0865fb790e583d9f5ac26aeeb8158 master
git_repo_checkout_branch "../js/jQuery-File-Upload" 445e23b5254b424d98f3e92790ccb0ee3d0ceb44 master
git_repo_checkout_branch "../js/jQuery-filedrop" f0618370cc87221cc1e3d693c3eb3f7173a15c0f master
git_repo_checkout_branch "../js/jquery-filedrop-alt" 6fb5fc20aca6646547f7424cdd5c18099d0ee8e6 master
git_repo_checkout_branch "../js/jquery-fixclick" 762bb2c01a63101ed8c03845510e2be3e896eeb4 master
git_repo_checkout_branch "../js/jquery-flexselect" f61aa88f8b81d3c409051365034f6ca0d84b0d22 master
git_repo_checkout_branch "../js/jquery-floatlabels" 9dec978136f7206bdc8672bb55d16597122723cc master
git_repo_checkout_branch "../js/jquery-form" 4bbb64591c7f2607cf2ebf91c9e313f83b440e5f master
git_repo_checkout_branch "../js/jquery-form-accordion" a8dea7b4b98cd13a1be2e6ae5ee00fd63a1a01b7
git_repo_checkout_branch "../js/jquery-fracs-page-overview" fd4dcfa2694265773c534fd532ee6d8f4195817b master
git_repo_checkout_branch "../js/jquery-freewall" 24ac21915ace6e9a3efc17a8e2ae233affb21451 master
git_repo_checkout_branch "../js/jquery-fseditor" 190fc7a0e475d6d7124940e048d0a785174e084d master
git_repo_checkout_branch "../js/jquery-fullcalendar" a0c27fd143e3ca43b4ba31ce97af124290482f17 master
git_repo_checkout_branch "../js/jquery-fullscreen" f7d7c0703fc98c69c7f1508ac6674ce203d3f047 master
git_repo_checkout_branch "../js/jquery-globalize" 755c9c536ff4cdc717ffe127d0a1479e0133f9f5 master
git_repo_checkout_branch "../js/jquery-grewform" e5ebdd789993e7b550d411f48285662ff126fc26 master
git_repo_checkout_branch "../js/jquery-gridalicious" 28e8152091133984a7887bfb7d3ac4152db98777 master
git_repo_checkout_branch "../js/jquery-gritter" a594a03f1814954f942ab50e08401bec9a21603c master
git_repo_checkout_branch "../js/jquery-grumble-tooltip" ac8bc751db2a4755174a4d340f4abd1748bf9450 master
git_repo_checkout_branch "../js/jquery-handsontable" 841f685fb905a1940e90bb14f41638d5582134c5 master
git_repo_checkout_branch "../js/jquery-hashchange" ea00b096ca61cd651d5b44d31be8dc64646c6076 master
git_repo_checkout_branch "../js/jquery-historize-input" b62a7386768e57347fdca2b587344a438ea1f4e9 master
git_repo_checkout_branch "../js/jquery-hotkeys" 4dbba5c13baec9ef44ec459271ccb6a0ffe91b21 master
git_repo_checkout_branch "../js/jquery-html5-upload" c7900cea7c51a84e353a769feb570379519a8ef0 master
git_repo_checkout_branch "../js/jquery-html5sortable-dragndrop" b90b6baac95cdc0df1ec1682b7181ff94b1f7820 master
git_repo_checkout_branch "../js/jquery-iCheck" a97450ab337fd66e77e98378e4971713bda4ff19 master
git_repo_checkout_branch "../js/jquery-icheckbox" 3f72629a40788779bbe4fa3e73467fe7d4944abd master
git_repo_checkout_branch "../js/jquery-idealforms" ad91ab67dbea5328c9af498702d22f546c2d3a82 master
git_repo_checkout_branch "../js/jquery-image-preload" c832aa912870685595d8dd7186f62a82284eae73 master
git_repo_checkout_branch "../js/jquery-impress" 7ae776de4cd1e6a2eeb558079f3b38aa18726843 master
git_repo_checkout_branch "../js/jquery-in-field-labels" fa351c56bdbc8617e3116568db0d5bced48411bf master
git_repo_checkout_branch "../js/jquery-infinite-drag" 33137e2d7bcbe7893801099ab4994428fd062fa0 master
git_repo_checkout_branch "../js/jquery-input-indicator" 14e3b4b11bee220dba2414d6be211403b59d1b9a master
git_repo_checkout_branch "../js/jquery-insertAt" 4fd2145be2ab2d4b48f2905565a798e67ee83349 master
git_repo_checkout_branch "../js/jquery-inview" d17d731568bd29305a9ae93323d37d414caacb16 master
git_repo_checkout_branch "../js/jquery-jeditable" f9883a5292b550bab19cc673cc64a5faeca4ad1f master
git_repo_checkout_branch "../js/jquery-jq-console" 0267afa821581c033515a83d257da472471dd03d master
git_repo_checkout_branch "../js/jquery-jscrollpane" 47caf6e101183fea4c8403c9cff3f8ffcbd63f5e master
git_repo_checkout_branch "../js/jquery-jsizes" dcb10dfb46e7e1114365031e9ade99245cdd7979 master
git_repo_checkout_branch "../js/jquery-keynavigator" 2394db74638be4bc146ed6cfe76ba46791530f61 master
git_repo_checkout_branch "../js/jquery-kontrols" 6e6183fcf039704724ccc6299fb2d6383356c5ea master
git_repo_checkout_branch "../js/jquery-kwicks" a0b27baae18516a0cc0ba01a51d1c835b0b2d136 master
git_repo_checkout_branch "../js/jquery-loadprogress" 403e3be0855aff7d3965ac366419834e94f07290 master
git_repo_checkout_branch "../js/jquery-marcopolo" a1c6d2e7ab90f564377be497c03e84cb2221fbe7 master
git_repo_checkout_branch "../js/jquery-mask" 083c69b341a993111fb32aa895efd57e9bf8c738 master
git_repo_checkout_branch "../js/jquery-masked-input" 7ff98a8d2681201199e2c325f0f5bd5afa1e20f2 master
git_repo_checkout_branch "../js/jquery-match-height" ae0a8254ba56651a0bfb58284e107fa6f96969eb master
git_repo_checkout_branch "../js/jquery-menu-aim" 86ac9a0782ebc417b50114c2475f2a4b106cf121 master
git_repo_checkout_branch "../js/jquery-mobile-simpledialog" a8c93e8f063dbf0e50e90debad7a29f0d6c96904 master
git_repo_checkout_branch "../js/jquery-mockjax" 942bae9732ce761f6027da0d2a0ccf409c868758 master
git_repo_checkout_branch "../js/jquery-mousewheel" f94a47dc9eb7a681735887fb53ad30b2024b84f5 master
git_repo_checkout_branch "../js/jquery-multipage-form" 63e67dd8b95b2f15a0a9897e116d75dddbe3fae8 master
git_repo_checkout_branch "../js/jquery-multiselect" 1b09c2e4b28d390b7691cbd7529b43b173ad4ea7 master
git_repo_checkout_branch "../js/jquery-nestable-dragndrop" cd52d8a8410dcea667241457a9cbfa5904ced75d master
git_repo_checkout_branch "../js/jquery-nicescroll" ec4061b0bfeffc6ceeec3df0466fd6a99cb9cab2 master
git_repo_checkout_branch "../js/jquery-notify" a851efde3facdb9dbbe5883102d91666727796b3 master
git_repo_checkout_branch "../js/jquery-offline" e886d67adf730b65e24d599bcfadc4b46ccbce27 master
git_repo_checkout_branch "../js/jquery-omniwindow-modal-dialog" e8ea363da169c97c09cd0d25fb69f98fd09fe6a7 master
git_repo_checkout_branch "../js/jquery-onescroll" ebd1ad12b1a46f525fb6be11bb33bd92d09e9599 master
git_repo_checkout_branch "../js/jquery-pageslide" 0be3e5a73689516c3f0cd095ce8bc295f0ab95a4 master
git_repo_checkout_branch "../js/jquery-payment" 4b57839e3534c7a13ae3692974fdb0a0f78369f2 master
git_repo_checkout_branch "../js/jquery-pep-dynamic-dragndrop" 5e2750d5df5779458a68a70e75c95df315bf1989 master
git_repo_checkout_branch "../js/jquery-plusTabs" 4c2d4a9541dfbe0b9dc7a750f716eb0d2ccd1098 master
git_repo_checkout_branch "../js/jquery-postmessage" 642beacd02b433e53bb1710a63353ea32de60227 master
git_repo_checkout_branch "../js/jquery-print-in-page" fe908f49f5a636a34eb700de162d9cf018b61a77 master
git_repo_checkout_branch "../js/jquery-printarea" d3e6234b2adc262e3c6240af1ad50292c2550d87 master
git_repo_checkout_branch "../js/jquery-quovolver" 1a8081af0c2cb81bbbfedae1cc5ef4667cc791d5 master
git_repo_checkout_branch "../js/jquery-rangeslider" 9f84ba7ab6ecbce8bd103f8d541becd25a5fa989 master
git_repo_checkout_branch "../js/jquery-raty" 69e87075e379526f5accaa0fb5825a80262be1d7 master
git_repo_checkout_branch "../js/jquery-resize" e74fa1185a70ce0391e60986dff5087cf5116dec master
git_repo_checkout_branch "../js/jquery-responsive-tabs" ed4373ea03198d4ddccb3705ecb11e7d4bfc2b22 master
git_repo_checkout_branch "../js/jquery-rotary-dial-knob" d182c677b674e2b0be8fd76ee412a197a9244b61 master
git_repo_checkout_branch "../js/jquery-rowGrid" 4199b9d106f10a9eed13f9a408e67d2e5866d725 master
git_repo_checkout_branch "../js/jquery-sausage" 94c32bb25214eb91358af5c6222bf05b247ca9ae master
git_repo_checkout_branch "../js/jquery-scroller" 48cefe6d50476eef00b52396ec306e9e7a129ec5 master
git_repo_checkout_branch "../js/jquery-scrollintoview" 06834cf7fdba0e86cac84ed7761ea64a3a5fbec8 master
git_repo_checkout_branch "../js/jquery-scrollto" cb88f0b9ca64d806957139df93934b2f3ff6417f master
git_repo_checkout_branch "../js/jquery-select2" 79b5bf6db918d7560bdd959109b7bcfb47edaf43 master
git_repo_checkout_branch "../js/jquery-selectboxit" 8ceeeb1d8d9e34d491fe7e371bfbcee133458b5a master
git_repo_checkout_branch "../js/jquery-selectize" ca3c8ac6c6080437a613102f8518412ca1179841 master
git_repo_checkout_branch "../js/jquery-selectplus" 4ad795417ad2611b4d001f372e6fe7b1e69827e4 master
git_repo_checkout_branch "../js/jquery-serialize-form" 3e47568f2f1223c75ee97a3e0de300410d81f704 master
git_repo_checkout_branch "../js/jquery-shapeshift" e64fca743bf90e35a1abf724ed25f078cd828e1b master
git_repo_checkout_branch "../js/jquery-simple-datetimepicker" 675e0fab151cc64b2087bef7be4126b4ec2ae140 master
git_repo_checkout_branch "../js/jquery-simulate" 8a9e765f3930d09b4594aca7e30a3634c6f48ef4 master
git_repo_checkout_branch "../js/jquery-simulate-ext" 6e2f7cbb1bc8dc45a93d841fb8d3940d4a5a83bd master
git_repo_checkout_branch "../js/jquery-slider-jssor" 1c00d4dd51a438e4029999de9b8f6c0312658e54 master
git_repo_checkout_branch "../js/jquery-sliders" 451399f2be67910363b61ca7552624bc564bfd04 master
git_repo_checkout_branch "../js/jquery-smartresize" abcc3699b0715632b8a61513d3ef324a6eab0397 master
git_repo_checkout_branch "../js/jquery-sparkline" 8c97d7d0397fc72bedcfb93a86667e8fecce53c0 master
git_repo_checkout_branch "../js/jquery-splitter-panels" a654da8d67565ae7e7e5819266c7315186f6d101 master
git_repo_checkout_branch "../js/jquery-stick-em" 9719db5a358fe0811dbcf2c797a534a9f817d7aa master
git_repo_checkout_branch "../js/jquery-switchy" 4dd7a9fd771b0f06bbfe4610438a84ea11dbf0ac master
git_repo_checkout_branch "../js/jquery-terminal" 679b0d60d9645bfba530da7c4ca61a1cab13e970 master
git_repo_checkout_branch "../js/jquery-textfit" 1e5be0548c389f793c01164201182e320cc9cbdf master
git_repo_checkout_branch "../js/jquery-throttle-debounce" 54efbdc685cac07c9e5c2db02b1e101228b8fefb master
git_repo_checkout_branch "../js/jquery-timepicker" 496bb8d328767337a490135c48a67fea7ff526ce master
git_repo_checkout_branch "../js/jquery-timepicker-addon" 842046c3e3a933860ad88280269d9e0312fe96a6 master
git_repo_checkout_branch "../js/jquery-tocify" c179865a65c86e9323cdf2b9bfc66f812f077079 master
git_repo_checkout_branch "../js/jquery-toggles" 9ef5707b0e1d0965f3c4d0c9c340b6169b345b21 master
git_repo_checkout_branch "../js/jquery-tokeninput" aefac0bcff768fa93b08ace5e23635855e6aec59 master
git_repo_checkout_branch "../js/jquery-tooltip-toolbar" 5145fafb83ca6f5eabea4cc08957f97985a24b5b master
git_repo_checkout_branch "../js/jquery-transition" 609b99d603a8452a5981fdd84e646331ae27b040 master
git_repo_checkout_branch "../js/jquery-twinkle" a45d40bfdabc198431bbec024bbffa5c5dfc639d master
git_repo_checkout_branch "../js/jquery-ui" c644cc9466d5bd904fcc7a2969fbefb91fa7aaac master
git_repo_checkout_branch "../js/jquery-ui-bootstrap" 57bfc05198c34d2096b8436cd45ed05017120aca master
git_repo_checkout_branch "../js/jquery-ui-keyboard" c3c58c76f4aab527b6f7928458e3fa66a68b44b6 master
git_repo_checkout_branch "../js/jquery-ui-layout" 9ea2730c7179fb76bc5b57129c3c87554d50987b master
git_repo_checkout_branch "../js/jquery-ui-touch-punch" 72d67b63c98a6d9c324881343fcd423b88939ccf master
git_repo_checkout_branch "../js/jquery-validation" f80fa049b50e2f0945a8302481bcc049ab7e8292 master
git_repo_checkout_branch "../js/jquery-validation-engine" 810797e42bb669c7c8883de040ba156e161e41be master
git_repo_checkout_branch "../js/jquery-waypoints" 0c1d157fce93ac8a7151b1d96282c0f9c7ba48d5 master
git_repo_checkout_branch "../js/jquery-wookmark" 740eabc7ea8dfce5c006d5fdf15f401978ffa7f6 master
git_repo_checkout_branch "../js/jquery-zoomooz" 31d8a0a6fcf78363c6833f54721ff2f3ea0ab8b4 master
git_repo_checkout_branch "../js/jquery-zTree" a6ec3d1a25b684dac238114eb623513babd09a08 master
git_repo_checkout_branch "../js/jquery/src/sizzle" 4f36e79796e642a6019675a8fa114d8a8c0a5fb8 master
git_repo_checkout_branch "../js/jquery/src/sizzle/speed/benchmark.js" 425373377516c4af25eec12e4e3211b3550d9ea6 master
git_repo_checkout_branch "../js/jquery/test/qunit" 7054e6b5398176a9305b13f906466fe58dd213e6 master
git_repo_checkout_branch "../js/jquerypp" ad61dbb276cdc735f5a745132898deb17108059c master
git_repo_checkout_branch "../js/jquerytools" 7c6634b4dfa321b16cffcaa5ba06f95e9aa9b136 master
git_repo_checkout_branch "../js/jsbin" a789017d25eb8a6537ce9fdabd3118926b1d24f6 master
git_repo_checkout_branch "../js/jschannel" ee5fdc2f6a925291a269bd9086c9b86ec75a5c9b master
git_repo_checkout_branch "../js/jsconsole" 8fce70ed5f0d4ed63fcff4df1cd04b7f6bf77ef2 master
git_repo_checkout_branch "../js/jsdiff" 39cca690d2fca726c8d0ab4d005fbd2ee7b9bd33 master
git_repo_checkout_branch "../js/jskata" 5b12ecacbaadaffae830809619e6f3c749f4bffd master
git_repo_checkout_branch "../js/json-editor" 5cb68dda0e48a4da3d27132b5bac0b38d07cb39a master
git_repo_checkout_branch "../js/json-select" edc6b5c7c7319c4df69b290f8634f4a35a182fc6 master
git_repo_checkout_branch "../js/json2" 3d7767b6b1f3da363c625ff54e63bbf20e9e83ac master
git_repo_checkout_branch "../js/json3" e282232c1b02cd8de6b727aa8d0f50775bf82f2f master
git_repo_checkout_branch "../js/json5" b0f09f5a18ffcc0b1dbc366abb87ca4003761dbe master
git_repo_checkout_branch "../js/jsPanel-dialog" 40a2e37889b36c93d87480b7882614b99bf44bcb master
git_repo_checkout_branch "../js/jsPDF" 7fec45fd9d310e7397ad7a9abe9459525b73c29e master
git_repo_checkout_branch "../js/jsSHA" bb71c600a90b49c5bd6868d37379399defdf20db master
git_repo_checkout_branch "../js/jstat" 55b765d3272a174878e6b1b953ea399d8ec531d1 master
git_repo_checkout_branch "../js/jsTimezoneDetect" 0cf95e3410337790cb4284dd73c790ccc06133db master
git_repo_checkout_branch "../js/jwerty" 5636d3515064322615afb29cad92c3b45d9d7e84 master
git_repo_checkout_branch "../js/kamino" a134c6a05f58ac264f881d4ca7c13ac8299069d2 master
git_repo_checkout_branch "../js/kebab-pubsub-queue" 1a3e1e3badd02a63f50215a92a38065ddd6ce163 master
git_repo_checkout_branch "../js/keyboard-js" 0a9a1a399ecfab64a2589375c61031d9337c8778 master
git_repo_checkout_branch "../js/keyboard-layout-editor" 3932c2eb57f163c7a3e8271c5d33ec141e1b946a master
git_repo_checkout_branch "../js/keyboard-layout-learn" f9be28ef16fe0a87cbee9817d35522043cdb251a master
git_repo_checkout_branch "../js/keycode" 5b1eaa612ff7f8f5a02bfe241b45abc5fa3ec268 master
git_repo_checkout_branch "../js/keydrown-keyboard-repeat" 9eb5e2beb407607132a22f26b36c9f47272c6819 master
git_repo_checkout_branch "../js/keymaster" 1ea29b8498456b8afa07c5a76382addc3691c87f master
git_repo_checkout_branch "../js/keyvent-keyboard-event-simulator" da991a31ebaf12416d2e48538d5656a7296a6c83 master
git_repo_checkout_branch "../js/Kizzy-localcache" 34ea026f3655d04f49b10078cda6246674e7a981 master
git_repo_checkout_branch "../js/laconic" effd9d92a3db94ded57c014c8babb640359075bd master
git_repo_checkout_branch "../js/ladda" a4503e95c6c091308c6b5cc4efd9d9893ac00c19 master
git_repo_checkout_branch "../js/large-local-storage" e4fc5d03be1dfd497f29b0dadde25e3c5388c0ea master
git_repo_checkout_branch "../js/lazy" 3f89478b6aa8f882317a9bdeecb824f52cbcd731 master
git_repo_checkout_branch "../js/lazyload" 73508d7674586c249195168d65a62e8569098a29 master
git_repo_checkout_branch "../js/lazyload-all" 3b0ecf1c4fa7a23cc8f09f40fce47bac3e344c44 master
git_repo_checkout_branch "../js/less" 5223e315ade147815e24fe72f3f654f9a5823820 master
git_repo_checkout_branch "../js/lettering.js" 1e298caeb40c08556489f7ceaf24cecfe6b759dd master
git_repo_checkout_branch "../js/liquidmetal-scoring-algo" 29899b4410f17d2176b98674d9d659a84ffd808f master
git_repo_checkout_branch "../js/locache" 0029c813c000a365483f829c5ff3c24941e2b44b master
git_repo_checkout_branch "../js/LocalConnection" 24db2ffd3364901954bb5c65de7425281db92fe2 master
git_repo_checkout_branch "../js/lodash" 2ee614ae55b9125f5b7249b9073ee8b4478b34f8 master
git_repo_checkout_branch "../js/loglevel" 7af50ae5a04877f4206d8c1ef9297525ee588823 master
git_repo_checkout_branch "../js/loStorage" afe96f4cdc1716716c5ee98f6b1ef8d9d7bc5521 master
git_repo_checkout_branch "../js/lunr-search-engine" f1cdf61248bdfddb793c0936c134e16ca37e8969 master
git_repo_checkout_branch "../js/machina" 352c77f7664d9d89ec6880b7a2c0756e6a2dd08f master
git_repo_checkout_branch "../js/machina-promise" 9f41bd2ada0113c16a2e11efd6bd34be7482728f master
git_repo_checkout_branch "../js/malihu-scrollbar" 179ced37ef972b2c44bb4b71d20a6310fa317867 master
git_repo_checkout_branch "../js/markdown" 53e53d610ebdd4bc3c2d0cacaf9eccfa34f98360 master
git_repo_checkout_branch "../js/marked" af8240892bb28b5be48b8276a2c948538a57cbd9 master
git_repo_checkout_branch "../js/marked-kramed" aa2aa13018bf1a406dc958d2f1d503e3a238622d master
git_repo_checkout_branch "../js/marked-toc" 81559e4fe3d788e5a27819d7f0deaf7faa5d1209 master
git_repo_checkout_branch "../js/mason" 5eaf7b41c7df72526a770819e46cdc04fd2ade1d master
git_repo_checkout_branch "../js/masonry" 832851939c554f3147b3a79af7b9eb99b28d1b84 master
git_repo_checkout_branch "../js/mathjax" ddac71bae69cc14f86b75222338fa32cedd098ff master
git_repo_checkout_branch "../js/mathjax-dev" e33439e9f25481401a4009f284656ae67bb34d0a master
git_repo_checkout_branch "../js/mediaelement" d799a546ed179be1ed575bde86f36c239ee25875 master
git_repo_checkout_branch "../js/meny-menu" 4530fc5cc27d19c95038b72e29d32d3511dabfbd master
git_repo_checkout_branch "../js/mercury-wysiwyg-editor" 1cc637b0bccea19085f824d2881c6513ed5ee8ae master
git_repo_checkout_branch "../js/mersenne-twister" 5f1bb0c301fb340fc63f2cafc262353574016abf master
git_repo_checkout_branch "../js/MessageChannel" ff566a0a3ee1f01c3b0081af824979d9228597af master
git_repo_checkout_branch "../js/metalsmith" dc4002abbb69be260f8dbe09bd944c25708a2502 master
git_repo_checkout_branch "../js/miso.dataset" 1399b516cad0865eb5a98c106bc0c80c5d24a9bf master
git_repo_checkout_branch "../js/miso.events" 68b66f4d76819e32aa1c3c749ea7cd93eaa0a507 master
git_repo_checkout_branch "../js/mocha" c0bcf71e84ddf4da1396a0574e74eccbc9196a3b master
git_repo_checkout_branch "../js/model-reactive-dataviz" 97219b71707f612819e85d6d4d7a59421b3b88bf gh-pages
git_repo_checkout_branch "../js/Modernizr" 5d891e1babef2570d43218aa2fa47048bc555bdf master
git_repo_checkout_branch "../js/moment" 47dee3fae668b07b9bf9126ed905f479d91a448e master
git_repo_checkout_branch "../js/monologue" f6d9ffa4e509c282e30db9266b40bb4e54e9f409 master
git_repo_checkout_branch "../js/Montmartre" d2c1f311c84d2c2e4359bf78ae4db6550f0a15f9 master
git_repo_checkout_branch "../js/mousetrap" d8c13217b99c244c7d5edeb5c6ea3112c50f962f master
git_repo_checkout_branch "../js/mousetrap.help" 73ce2a44469229d8040357647c2a21fa63898860 master
git_repo_checkout_branch "../js/move" 64e87f02b638dba0075fa3cdcf6f6fdd08a41a4c master
git_repo_checkout_branch "../js/multi-level-push-menu" 2cc6cf4799dc844f19d3fd8d51f90596d5a07a82 master
git_repo_checkout_branch "../js/multilevel-pushmenu" c954082c71675258a56987e4789910ada866f57b master
git_repo_checkout_branch "../js/nested-grid-layout" 0fc86c1833d4815cd5e3cdc7a9cd568258728eac master
git_repo_checkout_branch "../js/no-ui-slider" d645c21fba0aadb45678af84f4ec3a121ff6ec8a master
git_repo_checkout_branch "../js/node-si" f201cee70a524f2126968878215fd95bd2720690 master
git_repo_checkout_branch "../js/notifyjs" 3e98e714c6f63eace14fcdcfd491aa013f11622e gh-pages
git_repo_checkout_branch "../js/noty" 089923e5de440ce5f8e4745fc36a0f7d13486514 master
git_repo_checkout_branch "../js/nprogress" a1f354ba1278e4f14c51811b027462480eb22fac master
git_repo_checkout_branch "../js/numbers-math" 6c6037465a85b94d793c591c117df2c720017098 master
git_repo_checkout_branch "../js/numeral" 4a0c8f15ab0e77847804dbb66018edd06c0e9ba0 master
git_repo_checkout_branch "../js/numeric" 566074cc12b5340f53638a2302bc291c5c1ef575 master
git_repo_checkout_branch "../js/object-path" 8821fbc929b83e4f7387de07c0bf9f490a0a4313 master
git_repo_checkout_branch "../js/objeq-json-querying" c07dc70f49a212f033e1f83c25fa9b5001d7e07c master
git_repo_checkout_branch "../js/offline" a5fdd4fbdcc499046c52388d21da5d6b48d4f5e7 master
git_repo_checkout_branch "../js/one-color" 111adc257330c6ceb426e1d8cb6bb7c818548257 master
git_repo_checkout_branch "../js/pace-automatic-progress" 896a0a7ccd018e47656d8a006c1dd575f0286ab4 master
git_repo_checkout_branch "../js/pageguide" 4a77b208623d7408bdf06e04790f553724cd7c4c master
git_repo_checkout_branch "../js/pagejs-router" 1e572e3acffa6ef1dc45eff4fa464d5de671e894 master
git_repo_checkout_branch "../js/Parsley" 8fa7bb0750f2df9745dfbe7f6c9c881ca3463d0b master
git_repo_checkout_branch "../js/peerjs-server" 9e9e3840c51912213501e8fd80ac99a005799ec9 master
git_repo_checkout_branch "../js/peerjs-WebRTC-inter-browser-comms" aa281474cfb667991e7066279386b69dcf0b7eea master
git_repo_checkout_branch "../js/pen-live-edit" b009623d7c5f8a9de3cb4792ee81111dba3bc452 master
git_repo_checkout_branch "../js/persistJS" 1adeeadcdb40b0faaae36aaadb4305484f0b2a4c master
git_repo_checkout_branch "../js/pie-menu" 98e46ccc8149c6f18e0b1206f05d944fbe47f2ed master
git_repo_checkout_branch "../js/pivot.js" 0b0f3ad9f3c6c3ab716dd42a5cdc3504af594702 master
git_repo_checkout_branch "../js/PointerEvents-polyfill" 75e853355624df6862eb106044bc823bef2d92d2 master
git_repo_checkout_branch "../js/postal" 228bf4671e754e2e6c004a713600ce708e5360e7 master
git_repo_checkout_branch "../js/postal-diagnostics" a84c944fe00479f2ee88261c559e26ec7d4dd135 master
git_repo_checkout_branch "../js/postal-DOM" 01b955bf40f6951f1eaeab6eff34f23f724484dc master
git_repo_checkout_branch "../js/postal-federation" a7e9c81c76b8ece22c15f5f62064cd9aac8f39e6 master
git_repo_checkout_branch "../js/postal-machina" b4f5341b8dc22dd54044640f543d3b76cf8756a0 master
git_repo_checkout_branch "../js/postal-monologue" 47d29e945eed8cb0bc0624c0de0b883b7dce138f master
git_repo_checkout_branch "../js/postal-when" 79e2462b7a5bd25c28af5cad0c4b4ce31e8bc60b master
git_repo_checkout_branch "../js/postal-xframe" 1c36f7d9cdabf7a68e663208086af4c4a96a7692 master
git_repo_checkout_branch "../js/priority-queue" 1405aafc346ca95a40dfb7c496f95381cce38ad6 master
git_repo_checkout_branch "../js/Probability-F" 51bb5d20e07a96368ce002cebf6b4a9ee8746cec master
git_repo_checkout_branch "../js/progress" f217cf589800e90e17108793a8044e3cbecf7703 master
git_repo_checkout_branch "../js/qTip2" e11baaac3213da670d8d716a7610259a11e6d2a4 master
git_repo_checkout_branch "../js/queue" 6dd6359f3ae789028c405c6879e0d210769c0b3f master
git_repo_checkout_branch "../js/quickdiff" fb9c5f08cd9340ded2c9059d5b7812cefa32b86a master
git_repo_checkout_branch "../js/qunit" 7054e6b5398176a9305b13f906466fe58dd213e6 master
git_repo_checkout_branch "../js/radial-menu" 0c06ef1683a18cd0c60a2f048f6d3c990589e7d8 master
git_repo_checkout_branch "../js/radial-responsive-menu" c9c8615046cc01dc550df13c42fc1c6f830446c3 master
git_repo_checkout_branch "../js/rainbow-vis" 2f29dd66ff0f9f1ed848cc8558b29bf6a78852c8 master
git_repo_checkout_branch "../js/rangeslider" 2b8be83576337ced629274057f23d9d94a6b1443 master
git_repo_checkout_branch "../js/rangy" f574d3ca856c91d3c3389a76c9743a0eb2f8d00a master
git_repo_checkout_branch "../js/rangyinputs" 8defc4022093a7145ef3ec8445649acf3da4d240 master
git_repo_checkout_branch "../js/recline" 7757e563ee180e136a8a4008b6ac7b7b56e3050f master
git_repo_checkout_branch "../js/regression" a2b4b131f4ba06c343774d96605a959fb8055866 master
git_repo_checkout_branch "../js/rekapi-keyframe-animation" d18af263e2e19c894319ed8794c5eda9d8b1df67 master
git_repo_checkout_branch "../js/require-domReady" 1c2356c7bc8701085d0b40eff503680933560117 master
git_repo_checkout_branch "../js/require-handlebars" 9dc102b4e7f6d65f400c98b540d3354d99cf82ab master
git_repo_checkout_branch "../js/require-less" 9073280a3cacacfba42d723a9c178c87149732e1 master
git_repo_checkout_branch "../js/require-plugins" bdc452ca04b8f800aee35c0baac42429ab6b5ed4 master
git_repo_checkout_branch "../js/require-text" 9fcaafe82a32e9f232eeaa33812b4a5d413fac7c master
git_repo_checkout_branch "../js/requireCSS" db33253e5998f3f080a8bf43d123433f8813e7e4 master
git_repo_checkout_branch "../js/requireJS" 69245fcff152df80e56b3ee196b93cf54adb2e26 master
git_repo_checkout_branch "../js/requirejs-coffeescript" 7488ac66475c3050871337557522b43d7df14887 master
git_repo_checkout_branch "../js/response.js" ae5b535d2c72e417875dd1555fd3f672a98ab26c master
git_repo_checkout_branch "../js/Responsive-Measure" ed7df598f9df5903a7d9e3e10dd6b63a58c190ac master
git_repo_checkout_branch "../js/responsive-multilevel-menu" 7fc79ab1ea9cd0575a7a9c96dcd06e6e2f657e12 master
git_repo_checkout_branch "../js/responsive-nav" d279b06076f2f57ef79d3c62bdf87cb67dc40156 master
git_repo_checkout_branch "../js/reveal.js" 4f455497ee8fae3ace73fceb880372b63f8f29d3 master
git_repo_checkout_branch "../js/reveal.js-presentable-TOC" 478399ed6f7da905680e82c1841bf6461c858f70 master
git_repo_checkout_branch "../js/rickshaw" 7dcada0d45cef8604ff1f46df4adc2bd10b04e3a master
git_repo_checkout_branch "../js/ring-progress-bar" 80785b9b84e4a2ca462eee41f58ed124340edd9e master
git_repo_checkout_branch "../js/riot" 7cabe7a1408fa0cc7dfc45815b6bb7a15c5819b8 master
git_repo_checkout_branch "../js/riveter-mixins" fda167de26566511b9e56ecbff1943586296f0fc master
git_repo_checkout_branch "../js/rivets" 5cd20248ee2ef03f537b81cff582e72b3e03422a master
git_repo_checkout_branch "../js/science" 6b3cf90d240cd07fa2a83937a4e369ebb8eab13b master
git_repo_checkout_branch "../js/scoped-querySelector-shim" 2da1c67a3b92f0b70e2ce751ad7dcf3c7d6e583b master
git_repo_checkout_branch "../js/SHA3-js" ac7f114fc8b737c9d8d26e37ee10375529455945 master
git_repo_checkout_branch "../js/shifty-tweens" cb7b99081ddfcb4d3f65877e14be4a038cde1817 master
git_repo_checkout_branch "../js/shotgun" 22bc6682e36045ea172d7a4f93a94ba0d9efeb29 master
git_repo_checkout_branch "../js/signal-compoundsignal" d2e197f6d9f759b34c5fd3da4c1adbfeb7e46f2d master
git_repo_checkout_branch "../js/signal-signals" 1a82bdd4097941bb010ab4a5757a67da460ce2f4 master
git_repo_checkout_branch "../js/simple-statistics" c16b59ea76ad310ec5934d0bd0cd0b89ec129055 master
git_repo_checkout_branch "../js/sinon-js" 416e77feef0d30b27af77ab4c2b486a8f89502cd master
git_repo_checkout_branch "../js/sisyphus" dd23f4108ee62df1ae343497786e7aee45ec1893 master
git_repo_checkout_branch "../js/sjcl-stanford-crypto-lib" 16dde36fa2a58845f639429acd5bc4e4ebb5a0f1 master
git_repo_checkout_branch "../js/sketch" 124895f6d1ef13ae04f6b1839c6273283a281583 master
git_repo_checkout_branch "../js/skrollr" f0971d3a9aa6978a2c5262ee01a85af215ba86e4 master
git_repo_checkout_branch "../js/SlickBack" 00b3d85128c7a020b51ce70f70cad7c1efb84bd9 master
git_repo_checkout_branch "../js/slickgrid" df07fcff2bf6516d7b2f29215ccda3c382da420b k0stya-rowspan
git_repo_checkout_branch "../js/slickgrid-checkbox-select-all-column-plugin" cf3d43ad95953b078d06606fde594a44caee082b master
git_repo_checkout_branch "../js/slickgrid-distinct-values-menu-plugin" 5ff33717127cd72cd74159d80f5a062e4e123d58 master
git_repo_checkout_branch "../js/slickgrid-enhanced-pager-plugin" fbfee780bea8caf8b4312fa8c5f5120710b85ca4 master
git_repo_checkout_branch "../js/slickgrid-guriddo-frozencolumns" 6d353e3919fd5c3e107192f2aa84570ef16ace03 master
git_repo_checkout_branch "../js/slickgrid-spreadsheet-plugins" 36ac2b5b4fd1147afcce0a2a9f3d079491c10c67 master
git_repo_checkout_branch "../js/slickgrid-surge-extensions" 9db1bd5b770d0c6ba5c1bf27f943780eb6089926 master
git_repo_checkout_branch "../js/slickgrid-totals-plugin" ebed7e10d9c8608f863e8bb4c9e784434aac115c master
git_repo_checkout_branch "../js/slickgrid/documentation/wiki" 8bd8b53087ac897847e6179d15a6198daf59aa27 master
git_repo_checkout_branch "../js/slickgrid/lib/hammer" ef1ec7a248aee3c3544d5d9aad9685c25fe3fc11 master
git_repo_checkout_branch "../js/slickgrid/lib/jquery-fixclick" 762bb2c01a63101ed8c03845510e2be3e896eeb4 master
git_repo_checkout_branch "../js/slickgrid/lib/jquery-iCheck" a97450ab337fd66e77e98378e4971713bda4ff19 master
git_repo_checkout_branch "../js/slickgrid/lib/jquery-jsonp" 9ee843dfb531cdc0f494d307e663ff34596ed522 master
git_repo_checkout_branch "../js/slickgrid/lib/jquery-jsonp/test/qunit" 403897f422a2b739dcd16c84e9bbc8afa6d7cd78 master
git_repo_checkout_branch "../js/slickgrid/lib/jquery-multiselect" 1b09c2e4b28d390b7691cbd7529b43b173ad4ea7 master
git_repo_checkout_branch "../js/slickgrid/lib/jquery-simulate" 8a9e765f3930d09b4594aca7e30a3634c6f48ef4 master
git_repo_checkout_branch "../js/slickgrid/lib/jquery-simulate/test/qunit" 403897f422a2b739dcd16c84e9bbc8afa6d7cd78 master
git_repo_checkout_branch "../js/slickgrid/lib/jquery-sparkline" 1c161fa62436e27d3ef07ced57bf4a01fa4dc8ca takacsv-work
git_repo_checkout_branch "../js/slickgrid/lib/jquery-sparkline/lib/rainbow-vis" 2f29dd66ff0f9f1ed848cc8558b29bf6a78852c8 master
git_repo_checkout_branch "../js/slickgrid/lib/keymaster" 1ea29b8498456b8afa07c5a76382addc3691c87f master
git_repo_checkout_branch "../js/slickgrid/lib/slickgrid-checkbox-select-all-column-plugin" cf3d43ad95953b078d06606fde594a44caee082b master
git_repo_checkout_branch "../js/slickgrid/lib/slickgrid-enhanced-pager-plugin" fbfee780bea8caf8b4312fa8c5f5120710b85ca4 master
git_repo_checkout_branch "../js/slickgrid/lib/slickgrid-guriddo-frozencolumns" 6d353e3919fd5c3e107192f2aa84570ef16ace03 master
git_repo_checkout_branch "../js/slickgrid/lib/slickgrid-spreadsheet-plugins" 36ac2b5b4fd1147afcce0a2a9f3d079491c10c67 master
git_repo_checkout_branch "../js/slickgrid/lib/slickgrid-surge-extensions" 9db1bd5b770d0c6ba5c1bf27f943780eb6089926 master
git_repo_checkout_branch "../js/slickgrid/lib/slickgrid-totals-plugin" ebed7e10d9c8608f863e8bb4c9e784434aac115c master
git_repo_checkout_branch "../js/slickgrid/lib/spectrum" 8aa582006103110498fef49a3662e3d5bf4616fe no-color
git_repo_checkout_branch "../js/slickgrid/lib/spectrum/lib/TinyColor" d3801b440f31d852b4bc1030c770225318fc4de2 gh-pages
git_repo_checkout_branch "../js/slickgrid/lib/threedubmedia" 328826bdd9490a7130985620db6aa96fc899df0a master
git_repo_checkout_branch "../js/slickgrid/lib/TinyColor" d3801b440f31d852b4bc1030c770225318fc4de2 gh-pages
git_repo_checkout_branch "../js/slickgrid/lib/verge-screendimensions" c9b2acca6c24a9e5f972ab12dafad8ccd06b1f85 master
git_repo_checkout_branch "../js/Slidebars" 5cb46565007930945e916250ba4c8f19e67c9528 master
git_repo_checkout_branch "../js/smash" a15f42ea95846bf7783df03cd163ea9d5960f0a7 master
git_repo_checkout_branch "../js/snap.js" 15c77da330d9e8ca580a922bc748d88553838a73 master
git_repo_checkout_branch "../js/snap.svg" 5b17fca57cbc4f8a8fd9ddd55cea2511da619ecf master
git_repo_checkout_branch "../js/Socialite" 71e756eed1ce77b98731e43c51a72e003feac273 master
git_repo_checkout_branch "../js/speakingURL" b05cd7e4601c7300ea3f157a221a4bdb4fe0357a master
git_repo_checkout_branch "../js/spectrum" d95a8ab4856f3a5dddcefe613082272ca6a2aad5 master
git_repo_checkout_branch "../js/spectrum/lib/TinyColor" d3801b440f31d852b4bc1030c770225318fc4de2 master
git_repo_checkout_branch "../js/spin" e55014b43f843eb032d98e4dff7b4d68572399d0 master
git_repo_checkout_branch "../js/square-responsive-menu" 9865b6d9e6656a31715000cb28a5f88fe988e824 master
git_repo_checkout_branch "../js/stapes-js-mvc" 434737e2fa3d27cc4553d041425eb25cf3d2c8ba master
git_repo_checkout_branch "../js/stately" 535bd9b5f0615574f41489fe7e39d0fda8fae6c4 master
git_repo_checkout_branch "../js/store-local" 70e8e74d66ab9c947ec29bd4148c6f1a3b1e1578 master
git_repo_checkout_branch "../js/StringView-polyfill" b0ac12a38d72d2d94c36c2851fb91c464cb15d0b master
git_repo_checkout_branch "../js/SyntaxHighlighter" e94af6df019624d7e93c71a66da44ff00b8decd9 master
git_repo_checkout_branch "../js/tabletop-import-google-spreadsheets" 1d04c30ba23c538de8e05e85b356a395d822f546 master
git_repo_checkout_branch "../js/tether" cd1aa2394129a611ced4e513e04ed713d4174b46 master
git_repo_checkout_branch "../js/tether-drop" 0cad0b8eba9b6f136b6b853c0fa89f5a7fa23cb2 master
git_repo_checkout_branch "../js/tether-tooltip" 103da12870c7b67fefea5d44e20a8fd0db37bc84 master
git_repo_checkout_branch "../js/three" faab5d4a5ad88793c1f2c0c49be426f8535275b5 master
git_repo_checkout_branch "../js/three-ex" b37f730082ddd726df2e757ec2dc09429a7c330e master
git_repo_checkout_branch "../js/thumbs-touch" 93cf21c2d8d6008f62deadba3d59aa3d9cbb724d master
git_repo_checkout_branch "../js/TinyColor" 3e5be699412a173428bd3caeb2314b9f882a3293 master
git_repo_checkout_branch "../js/tipue-drop-search-suggestions" 20b9895e38627286fad530e577419e99d800e461 master
git_repo_checkout_branch "../js/tipue-search-engine" 3388797fb32bd0d6836060962163e4dd30be811c master
git_repo_checkout_branch "../js/toastr-notifications" 4f1d70aaea664d155b847a4579ec7b540bc7fbd3 master
git_repo_checkout_branch "../js/TooltipMenu" c3f3bb4bcc9b0079d542d13fab7b64789f282b24 master
git_repo_checkout_branch "../js/tooltipster" a5974380f96fc26df43645f98d160efcd956dfd5 master
git_repo_checkout_branch "../js/tpz-base32" 54acf9e6f14f5e11616088d0c417ba8afbd6eea6 master
git_repo_checkout_branch "../js/tributary" 8e0b8892db6648b731b562cb81099f2148653ca3 master
git_repo_checkout_branch "../js/tv4-json-schema" 2a32c8c6dccab69a63ed9d9a9fd86f8e036a4136 master
git_repo_checkout_branch "../js/two-svg" 6f285c33186235eb665010944aaa4093714eb182 master
git_repo_checkout_branch "../js/typeahead" c404cd1e236d2fe1a179f8fc701a4bb252659e81 master
git_repo_checkout_branch "../js/typson-json-schema" f1516a53f7ea186856027d929ab3000b9ad3fad1 master
git_repo_checkout_branch "../js/ui-message-queue" cc334f3a212812b38a6ba2f43d74bb403602609d master
git_repo_checkout_branch "../js/ui-progress-bar" c089b48290f8748867238ec14dd28c4b5c50ed93 master
git_repo_checkout_branch "../js/underscore" cab31863af7873f0f148422cf4fbed2c60918b29 master
git_repo_checkout_branch "../js/underscore.math" cc29a2733b5cb34c5267fcf46d8dce86dce93a27 master
git_repo_checkout_branch "../js/underscore.string" 52be74cf2c8ef2c9a2164c72e71dacf955978d88 master
git_repo_checkout_branch "../js/URI.js-url-mutator" 891b5551da274d1ef3ff23ad3fdabea2b98344fd gh-pages
git_repo_checkout_branch "../js/uri.regex" b1917cdcb99d36cbc8a60bd79e04d509fc265783 master
git_repo_checkout_branch "../js/uuid" 03e81d2a3e1d568c95fc9d57860691cf3ce7bdf7 master
git_repo_checkout_branch "../js/veinjs-css-injection" 4241a45067a4105cae9529cf1bb1fb1934989997 master
git_repo_checkout_branch "../js/ventus-window-manager" caf790e8f70baf34b5590183b31f6ba4c279f6c0 master
git_repo_checkout_branch "../js/verge-screendimensions" c9b2acca6c24a9e5f972ab12dafad8ccd06b1f85 master
git_repo_checkout_branch "../js/verlet" 271af753940d8eb67cd2b0b37934d204ab2497da master
git_repo_checkout_branch "../js/video.js" a96978b1942f4910d67aab70db24602b1eefd063 master
git_repo_checkout_branch "../js/vows" 253ca34c103281f169c8094597bb66a1a1bbc847 master
git_repo_checkout_branch "../js/w2ui" f9b592193ffff7fd1c509136d5f00e8eb778b475 master
git_repo_checkout_branch "../js/webcola-constrained-force-layout" dfa207a204c9ed833834fc69494b6077706d0eee master
git_repo_checkout_branch "../js/wheel-menu" 10afa18a1801c888d01b53377ea7ed633a0a0325 master
git_repo_checkout_branch "../js/x-editable" 8adb0b1bf3761c98bbbebf40994bf150ec28f090 master
git_repo_checkout_branch "../js/xregexp" 7354fb84472289b15ee7c511442f74d6386e94ad master
git_repo_checkout_branch "../js/xtend" 94a95d76154103290533b2c55ffa0fe4be16bfef master
git_repo_checkout_branch "../js/zen-form" 4d3d4b9ef132eb27e6ec2936936001147bc0b72b master
git_repo_checkout_branch "../js/zepto-fast-jquery-alt" f4129d531ae81a680c02415e93438bf2c28784b5 master
git_repo_checkout_branch "../js/zeroclipboard" 1ec7da6bebafbd63153b14f6fa0db2d42f93b9d4 master
git_repo_checkout_branch "../js/zoom" cd373039c26d49015b03b3b36c49ebb4e6fb302d master
git_repo_checkout_branch "../js/zui53" c220ab8c118c9b2d1a70a4382a1380057d8ac5af master
git_repo_checkout_branch "../js/zurb-foundation" b0b05d8b52782d90b034faabf231648b4c04cc01 master
git_repo_checkout_branch "../php/atoum-unittests" e58c072c3066da6c18741cfb96121412b7a70eae master
git_repo_checkout_branch "../php/backbone-session" 5b0af6c7043bcb1c6fd014e881e210f88c0136f1 master
git_repo_checkout_branch "../php/collision_detection" 8614991c2707e64a109721ee88d745fc36ed1220 master
git_repo_checkout_branch "../php/DByte-PDOwrapper" 2221ec480d2de28205a83bee8a81775be422e8fe master
git_repo_checkout_branch "../php/domPDF" d52eb86598998239a0699b7146b1708e04081174 master
git_repo_checkout_branch "../php/easier-baseN-encoding" 5cadc4885a41b157be9a28646da09c6fc7f1cec1 master
git_repo_checkout_branch "../php/email-address-validation" 6af80e2750a33996ba4fb9490749c7d593681767 master
git_repo_checkout_branch "../php/ErrorHandler" a6649a6ef4e080f8876a3c2fefed4803d3c4fecc master
git_repo_checkout_branch "../php/github-api3-php" 5cdff4f5f1764d56185366c3ec4aa605608ded06 master
git_repo_checkout_branch "../php/HTMLawed" 2be4bdcb8e9df52bef82e91adaaa26970b5c4ef8 master
git_repo_checkout_branch "../php/HTMLpurifier" 80ebd4322e3b98bc25c3ed3effe99a1653bc00fc master
git_repo_checkout_branch "../php/hybridauth" fd51fb6d260ef48fe85494b55d9931374230074b master
git_repo_checkout_branch "../php/jsv4-php-json-schema" 0010dd68664bf248e1bf32abfae65b1e35300924 master
git_repo_checkout_branch "../php/kissCMS" 949353079f8b2fab22c5f81e58944b110d669b3b master
git_repo_checkout_branch "../php/kissCMS-themes" cfb7b8e0a735d4f3af196c171cec49c53a31830c master
git_repo_checkout_branch "../php/lessphp" 9dfb499ffdbfc7430f5ac3c095cf81826503b8d2 master
git_repo_checkout_branch "../php/niceJSON" 79a9419dfe98aa0ed53cc83307014751041d2c7e master
git_repo_checkout_branch "../php/omnipay" aa1de2346b365527486b16f0f07ff190effe6d3e master
git_repo_checkout_branch "../php/opauth" a9e76340229ece5e3f2115d267408193835d27b3 master
git_repo_checkout_branch "../php/opauth-facebook" 31e26188d1ac67a8d1831c1a8426bab2b3b7cd02 master
git_repo_checkout_branch "../php/opauth-github" 9c4fe16dc6498b2c94f4c2a41ab93b0fe4b7fa73 master
git_repo_checkout_branch "../php/opauth-google" 35df77684c14acb346a8c3753ae3809852d1a47e master
git_repo_checkout_branch "../php/opauth-linkedin" 76df2b9520b02f4e87d1d0bd6ce64a375dcba03c master
git_repo_checkout_branch "../php/opauth-live" 2a854d68cd5fbf10013afbf6008fff849f1f2d0b master
git_repo_checkout_branch "../php/opauth-openid" a90e5dd490c1c7c79dd3ab2ffe4bb7e3401127f0 master
git_repo_checkout_branch "../php/opauth-twitter" 24792d512ccc67e7d11e9249737616f039551c11 master
git_repo_checkout_branch "../php/packager" c4b7642ddf5308088eb7b0b259d45e02f4738e80 master
git_repo_checkout_branch "../php/PHP-Error" 0ce1c142a2e5d8c33fad99858507959307a61471 master
git_repo_checkout_branch "../php/php-json-format" ce2cb1cf44fcf969d5275bc02553a8efd5ede4e6 master
git_repo_checkout_branch "../php/php-markdown" b362286c57daaa2cb61f18be01a545752babbe66 master
git_repo_checkout_branch "../php/php-profiler" 61b80f1d955a25fbb5cc395aebfd7b636b2c61e1 master
git_repo_checkout_branch "../php/php-ref" 1b7436fb5a2ef5bf38c56fb20c2871a0cfc76f3d master
git_repo_checkout_branch "../php/phpass" 6d636f984ea5f422b66549763c798f4f649366bc master
git_repo_checkout_branch "../php/phpbrowscap" 081ece3c0f04c87203810f29b7644eb0c6ab2b21 master
git_repo_checkout_branch "../php/PHPExcel" ab4428e8d3a1393372c309ccbc427f906d43aa09 master
git_repo_checkout_branch "../php/phplist" 7dcb362339119bda81247b231491e4d826455927 master
git_repo_checkout_branch "../php/phplist-api" b7220dc5517ad94a8cf705ffed7b2c369d871890 master
git_repo_checkout_branch "../php/phpmailer" a56f4c5484d3df5f8dbdde9fbd660100de500aa9 master
git_repo_checkout_branch "../php/phpti-template-engine" 11944f3f31027c1d6dad258445c01cd8d7259636 master
git_repo_checkout_branch "../php/phpUnit" 892f497047822ccd3c3341a4f130080fd97ac7dc master
git_repo_checkout_branch "../php/profiler" 66edb80ab48673dd460b09ee88d0cb1c82766bbf master
git_repo_checkout_branch "../php/Secure-random-bytes-in-PHP" 85ef83620e5c7dffc53320d6d5549ca5f65272d3 master
git_repo_checkout_branch "../php/sentry" 57e8bac9cf62089fa23bad3ec4d068f01fdf9b8f master
git_repo_checkout_branch "../php/SimpleTest" cade7c06b1fc2cf705450f19a3906c737b6edf0e master
git_repo_checkout_branch "../php/SimpleTest-visualGUI" 25e83e243e61b942d23657d624dd07de2b57c961 master
git_repo_checkout_branch "../php/twig-template-engine" cced2b4027d0021aff8f5279b66313ea20b57ae3 master
git_repo_checkout_branch "../php/ultimatemysql" 8315c5c134a9d868294176dff8c7398a67c17e9f master
git_repo_checkout_branch "../php/Upload" 508ba2ba50119b6ab99a551806ef6b7d43c16b5c master
git_repo_checkout_branch "../php/yii" d4f109e5c2989348efb94a5864a753ee89f25986 master
git_repo_checkout_branch "../php/yii-phpexcel" 2b4046ef88dbbe3959533463c436123efa37102e master
git_repo_checkout_branch "../php/yii2" 164ddf98b09df78b03f78e8d5b9fb4139e27e831 master
git_repo_checkout_branch "../tooling/amdclean" b5780d8d2ce819c13589bffd657c92fcf1521dac master
git_repo_checkout_branch "../tooling/antlr" 4bb5f5c0c59290f23b309a63b2a0610beef538c2 master
git_repo_checkout_branch "../tooling/btyacc" ffb68b3500ae1ca3803e6682cecf2d26cac2bccf master
git_repo_checkout_branch "../tooling/csslint" 8bc5d769186cc932898ad6873221720e838e461f master
git_repo_checkout_branch "../tooling/csso" 8fb75882c0d50c03eb48e6cc2903a989c98af0a6 master
git_repo_checkout_branch "../tooling/denyhosts" 98c2aac34bb8e80537246960f64509d1c69274b6 sourceforge-master
git_repo_checkout_branch "../tooling/docco" 9bd5fc81cb0a13e1f56b33a546be3843ad34ec07 master
git_repo_checkout_branch "../tooling/doxygen" 9b76c1a9bb7039962933aeef398bb7aa2f59c3a5 master
git_repo_checkout_branch "../tooling/findW-find_in_worktree" aa9675959c76e02cf57e2aa0ccaffa19dc2c67e8 master
git_repo_checkout_branch "../tooling/gitbook" 6b76032bb1e6a52c6dec94daca95ab730e861e98 master
git_repo_checkout_branch "../tooling/glueJS" 3f69d7e3f7a2c8543eade0f1c6f664a53e9a8eb2 glue2
git_repo_checkout_branch "../tooling/google-closure-compiler" e910aca6637cbf85934136855dc3419065853a0b master
git_repo_checkout_branch "../tooling/greg" d577e8014ab979952e5d0107bcf3de043cd2f0fe master
git_repo_checkout_branch "../tooling/grunt-contrib-jshint" 7d654c3bab7cf76e48f3861d7d6151c5dc7c25c7 master
git_repo_checkout_branch "../tooling/grunt-contrib-requirejs" 899ed8f4606d823d64e9fa86d870da08cbb55036 master
git_repo_checkout_branch "../tooling/grunt-contrib-uglify" ae723ace0b4ba76f160de7683989832b070fae83 master
git_repo_checkout_branch "../tooling/grunt-multisourced-bower-config" 2202e48276d8b02c76cea5519fbe0436ce528f47 master
git_repo_checkout_branch "../tooling/grunt-umd-wrapper" 1855cfe9322e2ccfbaa9790efa27cb5d1c1bf01d master
git_repo_checkout_branch "../tooling/javascriptlint" e1bd0abfd424811af469d1ece3af131d95443924 master
git_repo_checkout_branch "../tooling/jison" 2be8fc61b164bb33fe3f1e4ce90c4c4729baa978 master
git_repo_checkout_branch "../tooling/jison/gh-pages" 29225af2e036e9524eedfa85850abf2fed4624a9 master
git_repo_checkout_branch "../tooling/jison/modules/ebnf-parser" 1b1126fe5e8352ae076195dc7b982d7dbc53aa59 master
git_repo_checkout_branch "../tooling/jison/modules/jison-lex" 7c8734a8b94a26158796b3c340378a16e4d83b55 master
git_repo_checkout_branch "../tooling/jison/modules/jison2json" 19f094dc591033e444120c201a6cf1ca30914d5f master
git_repo_checkout_branch "../tooling/jison/modules/json2jison" b7d1351d0f9821a3e50f396d2d7793f75de9d106 master
git_repo_checkout_branch "../tooling/jison/modules/lex-parser" c04f7e5f294cab3144722c8832566ddfd92cd6bc master
git_repo_checkout_branch "../tooling/jsbeautifier" 60fe74c6e11f3bd3ea1f1737c7f0fc825fff53a4 master
git_repo_checkout_branch "../tooling/JSDoc" 353afea49e8774183bca667829d3565fa9bc282e master
git_repo_checkout_branch "../tooling/JSHint" 37757f0195e9ee4eb4bd8aeb5162c2a3c1565832 master
git_repo_checkout_branch "../tooling/json" 349a245e40bc5dd43dfafff1963a22fd95508932 master
git_repo_checkout_branch "../tooling/PEG-js" 784db35cf5d248244a18312837fe4503392e8ef6 master
git_repo_checkout_branch "../tooling/PEG-tolmasky" c7e1412e3c01be9bf4336db2e1bbafb2576ef2b3 master
git_repo_checkout_branch "../tooling/phpDocumentor" 9cbe0bf8eeb621eb86929822ca52f857ae7f67f5 master
git_repo_checkout_branch "../tooling/requirejs-optimizer" b7ed3a2fec733d9b2323f95e0e7a0c8e5692e66d master
git_repo_checkout_branch "../tooling/source-map-combine" 0e0621073906139408f85a482d74980368f50151 master
git_repo_checkout_branch "../tooling/source-map-convert" 725b2347a83b42011da465d00678e45605361012 master
git_repo_checkout_branch "../tooling/source-map-inline" f0d9db8f2e31b2d52b071b89c8360f19eb85dcef master
git_repo_checkout_branch "../tooling/source-map-mold" 4e966b14917f85f618b12acf5eee7eaa440e011d master
git_repo_checkout_branch "../tooling/source-map-readwrite" 9d8f09a1e4ef7bf8584fa4e5775afc7f62285fc6 master
git_repo_checkout_branch "../tooling/uglify2" f36a1eaa8b5203ab7e4616108c33a0b68668a8db master
git_repo_checkout_branch "../tooling/UglifyCSS" 3c140347adb0ed9e85c89372d502fd96c35bcfb9 master
git_repo_checkout_branch "../tooling/vulcanize" 8a851f782b80870e2eb22f5340bc309abdc5fa63 master
git_repo_checkout_branch "../tooling/wsclean" 78e56497930f686e10659dd8a1adf3a9681bca72 master
git_repo_checkout_branch "../tooling/xmail" 33bf2eb3bdca4e79d8b6339d5ff9f8583c046cf7 master

# --- all done ---

popd                                                                           2> /dev/null  > /dev/null


<?php
/**
 * Created by PhpStorm.
 * User: ykmship
 * Date: 28/08/14
 * Time: 18:36
 */

namespace Kozz\Helper\DataMerge;


use Kozz\Components\ArrayUpdater\ArrayUpdater;
use Kozz\Components\DataMerge\DataMerge;
use Kozz\Components\DataMerge\Handler\BaseEntryHandler;
use Kozz\Components\DataMerge\Handler\Config\BaseEntryConfig;
use Kozz\Components\DataMerge\Handler\Config\BaseEntryConfig\ExcludePath;
use Kozz\Components\DataMerge\Handler\Config\ListConfig;
use Kozz\Components\DataMerge\Handler\Dependency\AuthorIdDependency;
use Kozz\Components\DataMerge\Handler\Dependency\ItemIdDependency;
use Kozz\Components\DataMerge\Handler\ListHandler;

class DataMergeVisyondHelper
{
  public static function merge(array $source, array $mergeWith, $authorId)
  {
    $merge = new DataMerge($source, $mergeWith);

    $baseHandler = new BaseEntryHandler(
      new BaseEntryConfig(function(BaseEntryConfig $config){
        $config->addExcludePath(new ExcludePath(function(ExcludePath $path){
          $path->setRetrieveClosure(function($data){
              return $data['node_grid']['cases'];
            });
          $path->setApplyClosure(function(&$data, $newPathData){
              return $data['node_grid']['cases'] = $newPathData;
            });
        }));
        $config->addExcludePath(new ExcludePath(function(ExcludePath $path){
          $path->setRetrieveClosure(function($data){
              return $data['node_grid']['scenarios'];
            });
          $path->setApplyClosure(function(&$data, $newPathData){
              return $data['node_grid']['scenarios'] = $newPathData;
            });
        }));
      }),
      function(BaseEntryHandler $handler)use($authorId){
        $handler->addDependency(
          new AuthorIdDependency(function(AuthorIdDependency $dependency)use($authorId){
            $dependency->setAuthorId($authorId);
            $dependency->setAuthorIdClosure(function($data){
                return $data["project_attributes"]["architect"]["user_id"];
              });
          })
        );
      }
    );

    $handlerCase = new ListHandler();
    $handlerCase->setConfig(new ListConfig(function(ListConfig $config){
      $config->setList(function($data){
          return $data['node_grid']['cases'];
        });
      $config->setListUpdater(function(&$data, $newList) {
          $data['node_grid']['cases'] = $newList;
        });
    }));
    $handlerCase->addDependency(new ItemIdDependency(function(ItemIdDependency $dependency){
      $dependency
        ->setItemId(function($item){
            return $item['case_id'];
          })
        ->setItemIdUpdater(function(&$item, $newId){
            $item['case_id'] = $newId;
          })
        ->setItemIdPostUpdate(function (&$data, array $association) {
            $data = ArrayUpdater::from($data)
              ->node("node_grid")->node("scenarios")->all()
              ->node("selected_cases_ids")->all()
              ->replaceAssoc($association);
            $data = ArrayUpdater::from($data)
              ->node("node_grid")->node("nodes")->all()->all()
              ->node("cases")->all()
              ->replaceAssoc($association);
            $data = ArrayUpdater::from($data)
              ->node("node_grid")->node("nodes")->all()->all()
              ->node("selectedCase")
              ->replaceAssoc($association);
          });
    }));
    $handlerCase->addDependency(new AuthorIdDependency(function(AuthorIdDependency $dependency) use($authorId){
      $dependency->setAuthorId($authorId);
      $dependency->setAuthorIdClosure(function($item){
          return $item['author_id'];
        });
    }));


    $handlerScenario = new ListHandler();

    $handlerScenario->setConfig(new ListConfig(function(ListConfig $config){
      $config->setList(function($data){
          return $data['node_grid']['scenarios'];
        });
      $config->setListUpdater(function(&$data, $newList) {
          $data['node_grid']['scenarios'] = $newList;
        });
    }));
    $handlerScenario->addDependency(new ItemIdDependency(function(ItemIdDependency $dependency){
      $dependency
        ->setItemId(function($item){
            return $item['scenario_id'];
          })
        ->setItemIdUpdater(function(&$item, $newId){
            $item['scenario_id'] = $newId;
          })
        ->setItemIdPostUpdate(function (&$data, array $association) {
            $data = ArrayUpdater::from($data)
              ->node("node_grid")->node("cases")->all()
              ->node("belongs_to_scenarios")->all()
              ->replaceAssoc($association);
          });
    }));
    $handlerScenario->addDependency(
      new AuthorIdDependency(
        function(AuthorIdDependency $dependency) use ($authorId){
          $dependency->setAuthorId($authorId);
          $dependency->setAuthorIdClosure(function($item){
            return $item['author_id'];
          });
        }
      )
    );

    $merge->addHandler($baseHandler);
    $merge->addHandler($handlerCase);
    $merge->addHandler($handlerScenario);
    $merge->addHandler(clone $handlerCase);
    $merge->addHandler(clone $baseHandler);

    $res = $merge->merge()->getResult();
    return $res;
  }
} 
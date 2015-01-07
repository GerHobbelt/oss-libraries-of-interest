<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge\Handler;

use Kozz\Components\DataMerge\Handler\Config\ListConfig;
use Kozz\Components\DataMerge\Handler\Container\ListContainer;
use Kozz\Components\DataMerge\Handler\Container\ListDifference;
use Kozz\Components\DataMerge\Handler\Dependency\ItemIdDependency;
use Kozz\Helper\Closure\ClosureHelper;

/**
 * Class ListHandler
 *
 * @package Kozz\Components\DataMerge\Handler
 */
class ListHandler extends AbstractHandler
{
  const COLLISION_ID_UPDATE = ListConfig::COLLISION_ID_UPDATE;
  const COLLISION_ID_APPEND = ListConfig::COLLISION_ID_APPEND;

  protected $wasArray = false;

  /**
   * @var ListConfig
   */
  protected $config;

  /**
   * @var ListContainer
   */
  protected $listSource;

  /**
   * @var ListContainer
   */
  protected $listMergeWith;

  /**
   * @return mixed
   */
  public function handle()
  {
    $this->listSource    = $this->getList($this->data->getSource());
    $this->listMergeWith = $this->getList($this->data->getMergeWith());

    $diff = $this->listSource->compareWith($this->listMergeWith, $this->config->getIdCollision());

    $this->processDelete($diff);
    $this->processInsertNew($diff);
    $this->processAppend($diff);

    $this->applyToSource();
  }

  /**
   * @param $data
   *
   * @return ListContainer
   * @throws \UnexpectedValueException
   */
  protected function getList($data)
  {
    $list = ClosureHelper::getFromClosure($this->config->getList(), $data, $data);

    if(is_array($list))
    {
      $list = new \ArrayIterator($list);
      $this->wasArray = true;
    }
    if(!$list instanceof \Traversable)
    {
      throw new \UnexpectedValueException("You trying merge List(Collection) data, but your data is not array or Traversable");
    }

    $container = new ListContainer($list, $this->dependencies);
    $container->iteratorToList();
    return $container;
  }

  /**
   * @param ListDifference $diff
   */
  protected function processDelete(ListDifference $diff)
  {
    $removedKeys = 0;
    foreach($diff->getDeleteFromSource() as $key => $id)
    {
      $this->listSource->remove($key - $removedKeys++);
    }
  }

  /**
   * @param ListDifference $diff
   */
  protected function processInsertNew(ListDifference $diff)
  {
    foreach($diff->getInsertFromNew() as $key => $id)
    {
      $this->listSource->push($this->listMergeWith->get($key));
    }
  }

  /**
   * @param ListDifference $diff
   */
  protected function processAppend(ListDifference $diff)
  {
    if(!$diff->getAppendFromNew())
    {
      return;
    }

    $idMap = $this->listSource->updateMap()->getIdMap();
    $maxId = max($idMap);

    /** @var ItemIdDependency $itemIdDependency */
    $itemIdDependency = $this->dependencies->get(new ItemIdDependency());

    $getId             = $itemIdDependency->getItemId();
    $updateId          = $itemIdDependency->getItemIdUpdater();
    $closurePostUpdate = $itemIdDependency->getItemIdPostUpdate();

    $updates = [];
    foreach($diff->getAppendFromNew() as $key => $id)
    {
      $newId = ++$maxId;
      $item  = $this->listMergeWith->get($key);
      $updates[$getId($item)] = $newId;
      $updateId($item, $newId);
      $this->listMergeWith->set($key, $item);
    }

    if($closurePostUpdate)
    {
      $data = $this->data->getMergeWith();
      $closurePostUpdate($data, $updates);
      $this->data->setMergeWith($data);
    }

    foreach($diff->getAppendFromNew() as $key => $id)
    {
      $item = $this->listMergeWith->get($key);
      $this->listSource->push($item);
    }
  }


  protected function applyToSource()
  {
    $source  = $this->data->getSource();
    $updater = $this->config->getListUpdater();
    $updater($source, $this->getPrepareSource());
    $this->data->setSource($source);
  }

  protected function getPrepareSource()
  {
    $preparedResult = $this->listSource;
    if($this->wasArray)
    {
      $preparedResult = $this->listSource->toArray();
      $preparedResult = $this->getResortedArray($preparedResult);
    }
    return $preparedResult;
  }

  protected function getResortedArray(array $preparedResult)
  {
    $idMap = $this->listSource->updateMap()->getIdMap();
    if($idMap)
    {
      asort($idMap);
      $preparedResult = array_values(array_replace($idMap, $preparedResult));
    }
    return $preparedResult;
  }

}
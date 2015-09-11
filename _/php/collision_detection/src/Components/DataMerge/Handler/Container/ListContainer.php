<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge\Handler\Container;

use Kozz\Components\Collection\Collection;
use Kozz\Components\DataMerge\Handler\Config\ListConfig;
use Kozz\Components\DataMerge\Handler\Dependency\DependencyManager;
use Kozz\Components\DataMerge\Handler\Dependency\AuthorIdDependency;
use Kozz\Components\DataMerge\Handler\Dependency\ItemIdDependency;
use Kozz\Helper\Closure\ClosureHelper;
use Kozz\Interfaces\IArrayable;
use Traversable;

class ListContainer extends Collection
{

  /**
   * @var ItemIdDependency
   */
  protected $itemIdDependency;

  /**
   * @var AuthorIdDependency
   */
  protected $authorIdDependency;

  /**
   * @var array
   */
  protected $hashMap = [];

  /**
   * @var array
   */
  protected $idMap = [];

  /**
   * @var array
   */
  protected $authorMap = [];

  /**
   * @var array
   */
  protected $authorOwnerMap = [];

  /**
   * @param Traversable $list
   * @param DependencyManager $dependencyManager
   */
  public function __construct(Traversable $list, DependencyManager $dependencyManager = null)
  {
    parent::__construct($list);
    if($dependencyManager)
    {
      /** @var ItemIdDependency $itemIdDependency */
      $itemIdDependency = $dependencyManager->get(new ItemIdDependency());
      /** @var AuthorIdDependency $authorIdDependency */
      $authorIdDependency = $dependencyManager->get(new AuthorIdDependency());

      $this->itemIdDependency   = $itemIdDependency;
      $this->authorIdDependency = $authorIdDependency;
    }

    $this->updateMap();
  }

  /**
   * @param ListContainer $container
   * @param string        $mode
   *
   * @throws \InvalidArgumentException
   * @return ListDifference
   */
  public function compareWith(ListContainer $container, $mode = ListConfig::COLLISION_ID_APPEND)
  {
    //This
    $removedIds = $this->getRemovedIds($container);
    $deletedIds = $this->filterIds($removedIds, $this);

    //With
    $insertedIds = $this->getInsertedIds($container);

    $collisionIds = $this->getCollisionIds($insertedIds, $removedIds, $container);

    $newIds = array_diff($insertedIds, $collisionIds);

    if($mode === ListConfig::COLLISION_ID_UPDATE)
    {
      $newIds = $newIds + $collisionIds;
      $collisionIds = [];
    }
    elseif($mode === ListConfig::COLLISION_ID_APPEND)
    {
      $deletedIds = ($this->authorIdDependency)
        ? array_diff($deletedIds, $collisionIds)
        : [];
    }
    else
    {
      throw new \InvalidArgumentException(sprintf("Invalid merge mode: %s", $mode));
    }

    $diff = new ListDifference;
    $diff->setInsertFromNew($newIds);
    $diff->setAppendFromNew($collisionIds);
    $diff->setDeleteFromSource($deletedIds);

    //var_dump("deleted from source", $deletedIds);var_dump();
    //var_dump("inserted, updated in new container", $insertedIds);var_dump();
    //var_dump("collision, from new container", $collisionIds);var_dump();
    //var_dump("new, from new container", $newIds);var_dump($newIds);
    return $diff;
  }

  /**
   * @return array
   */
  public function getIdMap()
  {
    return $this->idMap;
  }

  /**
   * @return $this
   */
  public function updateMap()
  {
    $this->idMap          = [];
    $this->hashMap        = [];
    $this->authorMap      = [];
    $this->authorOwnerMap = [];

    foreach ($this->getIterator() as $item)
    {
      $this->idMap[]       = $this->getItemId($item);
      $this->hashMap[]     = $this->getItemHash($item);
      $this->authorMap[]   = $this->getAuthorId($item);
    }
    if($this->authorIdDependency)
    {
      $authorIdClosure = $this->authorIdDependency;
      $this->authorOwnerMap = array_filter($this->authorMap, function($item) use ($authorIdClosure){
        return $item == $authorIdClosure->getAuthorId();
      });
    }
    return $this;
  }

  /**
   * @param ListContainer $container
   *
   * @return array
   */
  protected function getRemovedIds(ListContainer $container)
  {
    $removed    = array_diff($this->hashMap, $container->hashMap);
    $removedIds = array_intersect_key($this->idMap, $removed);
    return $removedIds;
  }

  /**
   * @param ListContainer $container
   *
   * @return array
   */
  protected function getInsertedIds(ListContainer $container)
  {
    $inserted    = array_diff($container->hashMap, $this->hashMap);
    $insertedIds = array_intersect_key($container->idMap, $inserted);
    $insertedIds = $this->filterIds($insertedIds, $container);
    return $insertedIds;
  }

  /**
   * @param array         $insertedIds
   * @param array         $removedIds
   * @param ListContainer $container
   *
   * @return array
   */
  protected function getCollisionIds(array $insertedIds, array $removedIds, ListContainer $container)
  {
    $collisionIds = array_intersect($insertedIds, $removedIds);

    if($this->authorIdDependency)
    {
      $maybeUpdatedIds     = $this->filterIds($collisionIds, $container);
      $maybeUpdatedThisIds = array_intersect($this->idMap, $maybeUpdatedIds);
      $maybeUpdatedThisIds = $this->filterIds($maybeUpdatedThisIds, $this);
      $updatedIds          = array_intersect($maybeUpdatedIds, $maybeUpdatedThisIds);

      $collisionIds = array_diff($collisionIds, $updatedIds);
    }

    return $collisionIds;
  }

  /**
   * @param array         $ids
   * @param ListContainer $container
   *
   * @return array
   */
  protected function filterIds(array $ids, ListContainer $container)
  {
    if($container->authorIdDependency)
    {
      $ids = array_intersect_key($ids, $container->authorOwnerMap);
    }
    return $ids;
  }

  /**
   * @param $item
   *
   * @return mixed
   */
  protected function getItemId($item)
  {
    return ClosureHelper::getFromClosure($this->itemIdDependency->getItemId(), $item);
  }

  /**
   * @param $item
   *
   * @return mixed
   */
  protected function getAuthorId($item)
  {
    $closure = $this->authorIdDependency ? $this->authorIdDependency->getAuthorIdClosure() : null;
    return ClosureHelper::getFromClosure($closure, $item);
  }

  /**
   * @param $item
   *
   * @return string
   */
  protected function getItemHash($item)
  {
    if ($item instanceof IArrayable)
    {
      $data = $item->toArray();
    }
    elseif ($item instanceof Traversable)
    {
      $data = iterator_to_array($item);
    }
    else
    {
      $data = $item;
    }

    return json_encode($data);
  }
} 
<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge\Handler\Dependency;


use Closure;

class ItemIdDependency extends AbstractDependency
{

  protected $itemId;
  protected $itemIdUpdater;
  protected $itemIdPostUpdate;

  public function setItemId(Closure $closure)
  {
    $this->itemId = $closure;
    return $this;
  }

  public function setItemIdUpdater(Closure $closure)
  {
    $this->itemIdUpdater = $closure;
    return $this;
  }

  public function getItemId()
  {
    return $this->itemId;
  }

  public function getItemIdUpdater()
  {
    return $this->itemIdUpdater;
  }

  /**
   * @param Closure $itemIdPostUpdate
   */
  public function setItemIdPostUpdate(Closure $itemIdPostUpdate)
  {
    $this->itemIdPostUpdate = $itemIdPostUpdate;
  }

  /**
   * @return Closure
   */
  public function getItemIdPostUpdate()
  {
    return $this->itemIdPostUpdate;
  }


} 
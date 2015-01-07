<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge\Handler\Config;


use Closure;

class ListConfig extends AbstractConfig
{
  /**
   * @var Closure
   */
  protected $list;

  /**
   * @var Closure
   */
  protected $listUpdater;

  /**
   * @var string
   */
  protected $idCollision = self::COLLISION_ID_APPEND;

  /**
   * @param Closure $list
   */
  public function setList(Closure $list)
  {
    $this->list = $list;
  }

  /**
   * @return Closure
   */
  public function getList()
  {
    return $this->list;
  }

  /**
   * @param string $idCollision
   */
  public function setIdCollision($idCollision)
  {
    $this->idCollision = $idCollision;
  }

  /**
   * @return string
   */
  public function getIdCollision()
  {
    return $this->idCollision;
  }

  public function isIdCollision($type)
  {
    return $this->getIdCollision() === $type;
  }

  /**
   * @param Closure $listUpdater
   */
  public function setListUpdater(Closure $listUpdater)
  {
    $this->listUpdater = $listUpdater;
  }

  /**
   * @return Closure
   */
  public function getListUpdater()
  {
    return $this->listUpdater;
  }


} 